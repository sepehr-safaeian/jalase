import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { InitPaymentResponse } from '@jalase/shared';
import { SubscriptionOrder } from '../subscriptions/entities/subscription.entity.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { User } from '../auth/entities/user.entity.js';
import { ZibalService } from './zibal/zibal.service.js';
import {
  describeZibalRequestResult,
  describeZibalStatus,
  describeZibalVerifyResult,
  isUserCancelledStatus,
} from './zibal/zibal-status.js';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly zibal: ZibalService,
    private readonly subscriptions: SubscriptionsService,
    private readonly config: ConfigService,
    @InjectRepository(SubscriptionOrder)
    private readonly ordersRepo: Repository<SubscriptionOrder>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  getCallbackUrl(): string {
    const base = this.config.get<string>(
      'API_PUBLIC_URL',
      'http://localhost:3000',
    );
    return `${base.replace(/\/$/, '')}/api/v1/payments/zibal/callback`;
  }

  buildPaymentRedirectUrl(trackId: string): string {
    const base = this.config.get<string>(
      'API_PUBLIC_URL',
      'http://localhost:3000',
    );
    return `${base.replace(/\/$/, '')}/api/v1/payments/zibal/start/${trackId}`;
  }

  async initiatePayment(
    userId: string,
    orderId: string,
    returnUrl?: string,
  ): Promise<InitPaymentResponse> {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new NotFoundException('سفارش یافت نشد');
    }

    if (order.status === 'paid') {
      throw new BadRequestException('این سفارش قبلا پرداخت شده است');
    }

    if (order.status !== 'pending_payment') {
      throw new BadRequestException('این سفارش قابل پرداخت نیست');
    }

    const resolvedReturnUrl = this.resolveReturnUrl(returnUrl);
    order.paymentReturnUrl = resolvedReturnUrl;
    await this.ordersRepo.save(order);

    if (order.gatewayTrackId) {
      const inquiry = await this.zibal.inquiryPayment(order.gatewayTrackId);
      if (inquiry.result === 100 && inquiry.status === 1) {
        await this.completeVerifiedPayment(order, order.gatewayTrackId);
        return {
          paymentUrl: null,
          trackId: order.gatewayTrackId,
          orderId: order.id,
          amountToman: order.amountToman,
          alreadyPaid: true,
        };
      }

      if (
        inquiry.result === 100 &&
        inquiry.status !== undefined &&
        inquiry.status > 1 &&
        inquiry.status !== 2
      ) {
        await this.subscriptions.markOrderGatewayFailure(
          order.id,
          inquiry.status,
        );
        throw new BadRequestException(describeZibalStatus(inquiry.status));
      }

      if (
        inquiry.result === 100 &&
        (inquiry.status === -1 || inquiry.status === 2)
      ) {
        return {
          paymentUrl: this.buildPaymentRedirectUrl(order.gatewayTrackId),
          trackId: order.gatewayTrackId,
          orderId: order.id,
          amountToman: order.amountToman,
          alreadyPaid: false,
        };
      }
    }

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    const amountRial = order.amountToman * 10;
    const description = this.buildOrderDescription(order);

    const response = await this.zibal.requestPayment({
      amount: amountRial,
      callbackUrl: this.getCallbackUrl(),
      description,
      orderId: order.id,
      mobile: user?.phone ?? undefined,
    });

    if (response.result !== 100 || !response.trackId) {
      this.logger.warn(
        `Zibal request failed for order ${order.id}: ${response.result} ${response.message}`,
      );
      throw new BadRequestException(
        describeZibalRequestResult(response.result),
      );
    }

    order.gatewayTrackId = String(response.trackId);
    order.gatewayStatus = -1;
    await this.ordersRepo.save(order);

    return {
      paymentUrl: this.buildPaymentRedirectUrl(order.gatewayTrackId),
      trackId: order.gatewayTrackId,
      orderId: order.id,
      amountToman: order.amountToman,
      alreadyPaid: false,
    };
  }

  async handleCallback(query: {
    trackId?: string;
    success?: string;
    status?: string;
    orderId?: string;
  }): Promise<string> {
    const trackId = query.trackId?.trim();
    if (!trackId) {
      return this.buildReturnRedirect('failed', undefined, 'شناسه پیگیری نامعتبر است');
    }

    const order = await this.ordersRepo.findOne({
      where: { gatewayTrackId: trackId },
    });

    if (!order) {
      return this.buildReturnRedirect(
        'failed',
        undefined,
        'سفارش مرتبط با این پرداخت یافت نشد',
      );
    }

    const gatewayStatus = query.status ? Number(query.status) : undefined;
    const callbackSuccess = query.success === '1';

    if (!callbackSuccess) {
      const terminalStatus = isUserCancelledStatus(gatewayStatus)
        ? 'cancelled'
        : 'failed';
      await this.subscriptions.markOrderGatewayFailure(
        order.id,
        gatewayStatus,
        terminalStatus,
      );
      return this.buildReturnRedirect(
        terminalStatus === 'cancelled' ? 'cancelled' : 'failed',
        order,
        describeZibalStatus(gatewayStatus),
      );
    }

    try {
      await this.completeVerifiedPayment(order, trackId);
      return this.buildReturnRedirect('success', order);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'تایید پرداخت ناموفق بود';
      this.logger.error(`Payment verify failed for trackId ${trackId}`, error);
      return this.buildReturnRedirect('failed', order, message);
    }
  }

  getZibalGatewayStartUrl(trackId: string): string {
    return this.zibal.getGatewayStartUrl(trackId);
  }

  async assertTrackIdForStart(trackId: string): Promise<void> {
    const order = await this.ordersRepo.findOne({
      where: { gatewayTrackId: trackId },
    });
    if (!order || order.status !== 'pending_payment') {
      throw new NotFoundException('جلسه پرداخت معتبر نیست');
    }
  }

  private async completeVerifiedPayment(
    order: SubscriptionOrder,
    trackId: string,
  ): Promise<void> {
    const verify = await this.zibal.verifyPayment(trackId);

    if (verify.result === 201 && order.status === 'paid') {
      return;
    }

    if (verify.result !== 100) {
      throw new BadRequestException(describeZibalVerifyResult(verify.result));
    }

    const expectedRial = order.amountToman * 10;
    if (verify.amount !== undefined && verify.amount !== expectedRial) {
      this.logger.error(
        `Amount mismatch for order ${order.id}: expected ${expectedRial}, got ${verify.amount}`,
      );
      throw new BadRequestException('مبلغ پرداخت با سفارش مطابقت ندارد');
    }

    if (verify.orderId && verify.orderId !== order.id) {
      this.logger.error(
        `OrderId mismatch for order ${order.id}: got ${verify.orderId}`,
      );
      throw new BadRequestException('شناسه سفارش با پرداخت مطابقت ندارد');
    }

    order.gatewayStatus = verify.status ?? 1;
    order.gatewayCardNumber = verify.cardNumber ?? null;
    await this.ordersRepo.save(order);

    const paymentReference = verify.refNumber
      ? `zibal-${verify.refNumber}`
      : `zibal-${trackId}`;

    await this.subscriptions.confirmOrderPayment(
      order.userId,
      order.id,
      paymentReference,
    );
  }

  private buildOrderDescription(order: SubscriptionOrder): string {
    if (order.orderType === 'addon' && order.addonKey === 'turbo') {
      return `خرید توربو جلسه (${order.monthsGranted} ماه)`;
    }
    return `خرید اشتراک ${order.planKey ?? 'جلسه'} (${order.monthsGranted} ماه)`;
  }

  private resolveReturnUrl(returnUrl?: string): string {
    const fallback = this.config.get<string>(
      'PAYMENT_RETURN_URL',
      'http://localhost:8081/subscription/result',
    );

    if (!returnUrl?.trim()) {
      return fallback;
    }

    const trimmed = returnUrl.trim();
    if (!this.isAllowedReturnUrl(trimmed)) {
      throw new BadRequestException('آدرس بازگشت مجاز نیست');
    }

    return trimmed;
  }

  private isAllowedReturnUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'jalase:' || parsed.protocol === 'exp:') {
        return true;
      }

      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
      }

      const allowedHosts = this.config
        .get<string>('PAYMENT_RETURN_ALLOWED_HOSTS', 'localhost,127.0.0.1')
        .split(',')
        .map((host) => host.trim().toLowerCase())
        .filter(Boolean);

      const host = parsed.hostname.toLowerCase();
      return allowedHosts.some(
        (allowed) => host === allowed || host.endsWith(`.${allowed}`),
      );
    } catch {
      return false;
    }
  }

  private buildReturnRedirect(
    status: 'success' | 'failed' | 'cancelled',
    order?: SubscriptionOrder,
    message?: string,
  ): string {
    const base = order?.paymentReturnUrl ?? this.config.get<string>(
      'PAYMENT_RETURN_URL',
      'http://localhost:8081/subscription/result',
    );

    const url = new URL(base);
    url.searchParams.set('status', status);
    if (order) {
      url.searchParams.set('orderId', order.id);
    }
    if (message) {
      url.searchParams.set('message', message);
    }
    return url.toString();
  }
}

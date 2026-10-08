import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  ADDON_CATALOG,
  PLAN_CATALOG,
  addMonths,
  calculateAddonOrderAmountToman,
  calculateOrderAmountToman,
  getOrderMonths,
  isPaidPlan,
  listAddons,
  listBillingPeriods,
  listPlans,
  normalizePlanKey,
  planToTier,
  resolveAiMonthlyLimit,
  type AddonKey,
  type BillingPeriodKey,
  type CreateAddonOrderRequest,
  type CreateOrderRequest,
  type PlanKey,
  type SubscriptionSummary,
  type OrderSummary,
  type WorkspaceMemberSummary,
  type WorkspaceSummary,
} from '@jalase/shared';
import {
  Subscription,
  SubscriptionOrder,
  Workspace,
  WorkspaceMember,
} from './entities/subscription.entity.js';
import { User } from '../auth/entities/user.entity.js';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionsRepo: Repository<Subscription>,
    @InjectRepository(SubscriptionOrder)
    private readonly ordersRepo: Repository<SubscriptionOrder>,
    @InjectRepository(Workspace)
    private readonly workspacesRepo: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly membersRepo: Repository<WorkspaceMember>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  getCatalog() {
    return {
      plans: listPlans(),
      addons: listAddons(),
      billingPeriods: listBillingPeriods(),
    };
  }

  async ensureFreeSubscription(userId: string): Promise<Subscription> {
    const existing = await this.findActiveSubscriptionEntity(userId);
    if (existing) {
      return existing;
    }

    // OSS build: grant Plus features without a payment gateway
    return this.subscriptionsRepo.save({
      userId,
      planKey: 'plus',
      status: 'active',
      billingPeriodKey: null,
      startsAt: new Date(),
      expiresAt: null,
      aiUsageCount: 0,
      aiUsagePeriodStart: null,
      hasTurbo: false,
      turboExpiresAt: null,
    });
  }

  async getSubscriptionSummary(userId: string): Promise<SubscriptionSummary> {
    const subscription = await this.resolveActiveSubscription(userId);
    return this.toSubscriptionSummary(subscription);
  }

  async createOrder(
    userId: string,
    payload: CreateOrderRequest,
  ): Promise<OrderSummary> {
    if (!isPaidPlan(payload.planKey)) {
      throw new BadRequestException('برای پلن رایگان سفارش لازم نیست');
    }

    const { monthsPaid, monthsGranted } = getOrderMonths(
      payload.billingPeriodKey,
    );
    const amountToman = calculateOrderAmountToman(
      payload.planKey,
      payload.billingPeriodKey,
    );

    const order = await this.ordersRepo.save({
      userId,
      orderType: 'plan',
      planKey: payload.planKey,
      addonKey: null,
      billingPeriodKey: payload.billingPeriodKey,
      status: 'pending_payment',
      amountToman,
      monthsPaid,
      monthsGranted,
      currency: 'IRT',
      subscriptionId: null,
      paidAt: null,
      paymentReference: null,
      gatewayTrackId: null,
      gatewayStatus: null,
      gatewayCardNumber: null,
      paymentReturnUrl: null,
    });

    return this.toOrderSummary(order);
  }

  async createAddonOrder(
    userId: string,
    payload: CreateAddonOrderRequest,
  ): Promise<OrderSummary> {
    const addon = ADDON_CATALOG[payload.addonKey];
    if (!addon) {
      throw new BadRequestException('افزونه نامعتبر است');
    }

    const subscription = await this.resolveActiveSubscription(userId);
    const planKey = normalizePlanKey(subscription.planKey);

    if (addon.requiresPaidPlan && !isPaidPlan(planKey)) {
      throw new ForbiddenException(
        'برای خرید توربو باید اشتراک فعال پلاس یا پرو داشته باشید',
      );
    }

    const { monthsPaid, monthsGranted } = getOrderMonths(
      payload.billingPeriodKey,
    );
    const amountToman = calculateAddonOrderAmountToman(
      payload.addonKey,
      payload.billingPeriodKey,
    );

    const order = await this.ordersRepo.save({
      userId,
      orderType: 'addon',
      planKey: null,
      addonKey: payload.addonKey,
      billingPeriodKey: payload.billingPeriodKey,
      status: 'pending_payment',
      amountToman,
      monthsPaid,
      monthsGranted,
      currency: 'IRT',
      subscriptionId: subscription.id,
      paidAt: null,
      paymentReference: null,
      gatewayTrackId: null,
      gatewayStatus: null,
      gatewayCardNumber: null,
      paymentReturnUrl: null,
    });

    return this.toOrderSummary(order);
  }

  async markOrderGatewayFailure(
    orderId: string,
    gatewayStatus?: number,
    terminalStatus: 'failed' | 'cancelled' = 'failed',
  ): Promise<void> {
    const order = await this.ordersRepo.findOne({ where: { id: orderId } });
    if (!order || order.status !== 'pending_payment') {
      return;
    }

    order.status = terminalStatus;
    order.gatewayStatus = gatewayStatus ?? null;
    await this.ordersRepo.save(order);
  }

  async confirmOrderPayment(
    userId: string,
    orderId: string,
    paymentReference?: string,
  ): Promise<{ order: OrderSummary; subscription: SubscriptionSummary }> {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new NotFoundException('سفارش یافت نشد');
    }

    if (order.status === 'paid') {
      const subscription = await this.resolveActiveSubscription(userId);
      return {
        order: this.toOrderSummary(order),
        subscription: this.toSubscriptionSummary(subscription),
      };
    }

    if (order.status !== 'pending_payment') {
      throw new BadRequestException('این سفارش قابل پرداخت نیست');
    }

    let subscription: Subscription;

    if (order.orderType === 'addon' && order.addonKey === 'turbo') {
      subscription = await this.activateTurboFromOrder(order);
    } else {
      subscription = await this.activateSubscriptionFromOrder(order);
    }

    order.status = 'paid';
    order.paidAt = new Date();
    order.paymentReference = paymentReference ?? `dev-${Date.now()}`;
    order.subscriptionId = subscription.id;
    await this.ordersRepo.save(order);

    return {
      order: this.toOrderSummary(order),
      subscription: this.toSubscriptionSummary(subscription),
    };
  }

  async listOrders(userId: string): Promise<OrderSummary[]> {
    const orders = await this.ordersRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return orders.map((order) => this.toOrderSummary(order));
  }

  async getOrder(userId: string, orderId: string): Promise<OrderSummary> {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId, userId },
    });
    if (!order) {
      throw new NotFoundException('سفارش یافت نشد');
    }
    return this.toOrderSummary(order);
  }

  async switchToFreePlan(userId: string): Promise<SubscriptionSummary> {
    const current = await this.findActiveSubscriptionEntity(userId);
    if (current) {
      current.status = 'cancelled';
      await this.subscriptionsRepo.save(current);
    }

    const free = await this.subscriptionsRepo.save({
      userId,
      planKey: 'free',
      status: 'active',
      billingPeriodKey: null,
      startsAt: new Date(),
      expiresAt: null,
      aiUsageCount: 0,
      aiUsagePeriodStart: null,
      hasTurbo: false,
      turboExpiresAt: null,
    });

    return this.toSubscriptionSummary(free);
  }

  async createWorkspace(userId: string, name: string): Promise<WorkspaceSummary> {
    const subscription = await this.resolveActiveSubscription(userId);
    const planKey = normalizePlanKey(subscription.planKey);
    if (planKey !== 'pro') {
      throw new ForbiddenException('ساخت ورک‌اسپیس فقط در پلن پرو ممکن است');
    }

    const trimmed = name.trim();
    if (trimmed.length < 2) {
      throw new BadRequestException('نام ورک‌اسپیس باید حداقل ۲ کاراکتر باشد');
    }

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user?.email) {
      throw new BadRequestException('برای ساخت ورک‌اسپیس ابتدا ایمیل پروفایل را تکمیل کنید');
    }

    const workspace = await this.workspacesRepo.save({
      name: trimmed,
      ownerId: userId,
      subscriptionId: subscription.id,
    });

    await this.membersRepo.save({
      workspaceId: workspace.id,
      userId,
      email: user.email,
      role: 'owner',
    });

    return {
      id: workspace.id,
      name: workspace.name,
      role: 'owner',
      memberCount: 1,
    };
  }

  async listWorkspaces(userId: string): Promise<WorkspaceSummary[]> {
    const memberships = await this.membersRepo.find({
      where: { userId },
      relations: { workspace: true },
    });

    const results: WorkspaceSummary[] = [];
    for (const membership of memberships) {
      const count = await this.membersRepo.count({
        where: { workspaceId: membership.workspaceId },
      });
      results.push({
        id: membership.workspaceId,
        name: membership.workspace.name,
        role: membership.role,
        memberCount: count,
      });
    }

    return results;
  }

  async addWorkspaceMember(
    userId: string,
    workspaceId: string,
    email: string,
    role: 'admin' | 'member' = 'member',
  ): Promise<WorkspaceMemberSummary> {
    await this.assertWorkspaceAdmin(userId, workspaceId);

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new BadRequestException('ایمیل معتبر نیست');
    }

    const existing = await this.membersRepo.findOne({
      where: { workspaceId, email: normalizedEmail },
    });
    if (existing) {
      throw new BadRequestException('این عضو قبلاً اضافه شده است');
    }

    const invitedUser = await this.usersRepo.findOne({
      where: { email: normalizedEmail, deletedAt: IsNull() },
    });

    const member = await this.membersRepo.save({
      workspaceId,
      userId: invitedUser?.id ?? null,
      email: normalizedEmail,
      role,
    });

    return this.toWorkspaceMemberSummary(member, invitedUser);
  }

  async listWorkspaceMembers(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceMemberSummary[]> {
    await this.assertWorkspaceMember(userId, workspaceId);

    const members = await this.membersRepo.find({ where: { workspaceId } });
    const summaries: WorkspaceMemberSummary[] = [];

    for (const member of members) {
      const user = member.userId
        ? await this.usersRepo.findOne({ where: { id: member.userId } })
        : null;
      summaries.push(this.toWorkspaceMemberSummary(member, user));
    }

    return summaries;
  }

  async getUserTier(userId: string) {
    const summary = await this.getSubscriptionSummary(userId);
    // Billing is disabled in OSS: bump legacy free accounts to plus
    return summary.tier === 'free' ? 'plus' : summary.tier;
  }

  private async activateSubscriptionFromOrder(
    order: SubscriptionOrder,
  ): Promise<Subscription> {
    if (!order.planKey) {
      throw new BadRequestException('سفارش پلن معتبر نیست');
    }

    const planKey = normalizePlanKey(order.planKey);
    const current = await this.findActiveSubscriptionEntity(order.userId);
    const now = new Date();
    const baseDate =
      current?.expiresAt && current.expiresAt > now ? current.expiresAt : now;

    const preservedTurbo = current?.hasTurbo ?? false;
    const preservedTurboExpires =
      current?.turboExpiresAt && current.turboExpiresAt > now
        ? current.turboExpiresAt
        : null;

    if (current) {
      current.status = 'cancelled';
      await this.subscriptionsRepo.save(current);
    }

    return this.subscriptionsRepo.save({
      userId: order.userId,
      planKey,
      status: 'active',
      billingPeriodKey: order.billingPeriodKey,
      startsAt: now,
      expiresAt: addMonths(baseDate, order.monthsGranted),
      aiUsageCount: 0,
      aiUsagePeriodStart: now,
      hasTurbo: preservedTurbo,
      turboExpiresAt: preservedTurboExpires,
    });
  }

  private async activateTurboFromOrder(
    order: SubscriptionOrder,
  ): Promise<Subscription> {
    const subscription = await this.resolveActiveSubscription(order.userId);
    const planKey = normalizePlanKey(subscription.planKey);

    if (!isPaidPlan(planKey)) {
      throw new ForbiddenException(
        'توربو فقط با اشتراک فعال پلاس یا پرو قابل فعال‌سازی است',
      );
    }

    const now = new Date();
    const baseDate =
      subscription.turboExpiresAt && subscription.turboExpiresAt > now
        ? subscription.turboExpiresAt
        : now;

    subscription.hasTurbo = true;
    subscription.turboExpiresAt = addMonths(baseDate, order.monthsGranted);
    return this.subscriptionsRepo.save(subscription);
  }

  private async resolveActiveSubscription(userId: string): Promise<Subscription> {
    const subscription = await this.findActiveSubscriptionEntity(userId);
    if (!subscription) {
      return this.ensureFreeSubscription(userId);
    }

    const planKey = normalizePlanKey(subscription.planKey);

    if (
      planKey !== 'free' &&
      subscription.expiresAt &&
      subscription.expiresAt <= new Date()
    ) {
      subscription.status = 'expired';
      subscription.hasTurbo = false;
      subscription.turboExpiresAt = null;
      await this.subscriptionsRepo.save(subscription);
      return this.ensureFreeSubscription(userId);
    }

    if (
      subscription.hasTurbo &&
      subscription.turboExpiresAt &&
      subscription.turboExpiresAt <= new Date()
    ) {
      subscription.hasTurbo = false;
      await this.subscriptionsRepo.save(subscription);
    }

    return subscription;
  }

  private async findActiveSubscriptionEntity(
    userId: string,
  ): Promise<Subscription | null> {
    return this.subscriptionsRepo.findOne({
      where: {
        userId,
        status: 'active',
      },
      order: { createdAt: 'DESC' },
    });
  }

  private async assertWorkspaceAdmin(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceMember> {
    const membership = await this.membersRepo.findOne({
      where: { workspaceId, userId },
    });
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      throw new ForbiddenException('دسترسی مدیریت ورک‌اسپیس ندارید');
    }
    return membership;
  }

  private async assertWorkspaceMember(
    userId: string,
    workspaceId: string,
  ): Promise<void> {
    const membership = await this.membersRepo.findOne({
      where: { workspaceId, userId },
    });
    if (!membership) {
      throw new ForbiddenException('به این ورک‌اسپیس دسترسی ندارید');
    }
  }

  private toSubscriptionSummary(subscription: Subscription): SubscriptionSummary {
    const planKey = normalizePlanKey(subscription.planKey);
    return {
      planKey,
      tier: planToTier(planKey),
      status: subscription.status,
      expiresAt: subscription.expiresAt?.toISOString() ?? null,
      aiUsageCount: subscription.aiUsageCount,
      aiMonthlyLimit: resolveAiMonthlyLimit(
        planKey,
        subscription.hasTurbo,
        subscription.turboExpiresAt,
      ),
      billingPeriodKey: subscription.billingPeriodKey as BillingPeriodKey | null,
      hasTurbo: subscription.hasTurbo,
      turboExpiresAt: subscription.turboExpiresAt?.toISOString() ?? null,
    };
  }

  private toOrderSummary(order: SubscriptionOrder): OrderSummary {
    return {
      id: order.id,
      orderType: order.orderType ?? 'plan',
      planKey: order.planKey ? normalizePlanKey(order.planKey) : null,
      addonKey: order.addonKey as AddonKey | null,
      billingPeriodKey: order.billingPeriodKey as BillingPeriodKey,
      status: order.status,
      amountToman: order.amountToman,
      monthsPaid: order.monthsPaid,
      monthsGranted: order.monthsGranted,
      createdAt: order.createdAt.toISOString(),
      paidAt: order.paidAt?.toISOString() ?? null,
    };
  }

  private toWorkspaceMemberSummary(
    member: WorkspaceMember,
    user: User | null,
  ): WorkspaceMemberSummary {
    return {
      id: member.id,
      userId: member.userId,
      email: member.email,
      displayName: user?.displayName ?? user?.firstName ?? null,
      role: member.role,
    };
  }
}

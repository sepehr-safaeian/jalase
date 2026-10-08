import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ZibalInquiryResponse,
  ZibalRequestPaymentPayload,
  ZibalRequestPaymentResponse,
  ZibalVerifyResponse,
} from './zibal.types.js';

const GATEWAY_BASE_URL = 'https://gateway.zibal.ir';

@Injectable()
export class ZibalService {
  private readonly logger = new Logger(ZibalService.name);

  constructor(private readonly config: ConfigService) {}

  getMerchant(): string {
    return this.config.get<string>('ZIBAL_MERCHANT', 'zibal');
  }

  getGatewayStartUrl(trackId: string | number): string {
    return `${GATEWAY_BASE_URL}/start/${trackId}`;
  }

  async requestPayment(
    payload: Omit<ZibalRequestPaymentPayload, 'merchant'>,
  ): Promise<ZibalRequestPaymentResponse> {
    const body: ZibalRequestPaymentPayload = {
      merchant: this.getMerchant(),
      ...payload,
    };

    return this.postJson<ZibalRequestPaymentResponse>('/v1/request', body);
  }

  async verifyPayment(trackId: string | number): Promise<ZibalVerifyResponse> {
    return this.postJson<ZibalVerifyResponse>('/v1/verify', {
      merchant: this.getMerchant(),
      trackId: Number(trackId),
    });
  }

  async inquiryPayment(trackId: string | number): Promise<ZibalInquiryResponse> {
    return this.postJson<ZibalInquiryResponse>('/v1/inquiry', {
      merchant: this.getMerchant(),
      trackId: Number(trackId),
    });
  }

  private async postJson<T>(path: string, body: unknown): Promise<T> {
    const url = `${GATEWAY_BASE_URL}${path}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        this.logger.error(
          `Zibal HTTP ${response.status} for ${path}: ${await response.text()}`,
        );
        throw new Error(`خطا در ارتباط با درگاه پرداخت (HTTP ${response.status})`);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('خطا در ارتباط')) {
        throw error;
      }
      this.logger.error(`Zibal request failed for ${path}`, error);
      throw new Error('ارتباط با درگاه پرداخت برقرار نشد');
    }
  }
}

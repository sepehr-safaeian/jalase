import type {
  AuthUser,
  OtpSendResponse,
  OtpVerifyResponse,
} from '@jalase/shared';
import { apiRequest } from './client';

export function sendOtp(phone: string): Promise<OtpSendResponse> {
  return apiRequest<OtpSendResponse>('/auth/otp/send', {
    method: 'POST',
    body: { phone },
  });
}

export function verifyOtp(
  phone: string,
  code: string,
): Promise<OtpVerifyResponse> {
  return apiRequest<OtpVerifyResponse>('/auth/otp/verify', {
    method: 'POST',
    body: { phone, code },
  });
}

export function getMe(token: string): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me', { token });
}

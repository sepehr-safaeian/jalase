import { Platform } from 'react-native';
import type {
  AuthUser,
  OtpSendResponse,
  OtpVerifyResponse,
  UpdateProfileRequest,
  UpdateUserSettingsRequest,
} from '@jalase/shared';
import { apiRequest, apiUpload } from './client';

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

export function sendEmailOtp(email: string): Promise<OtpSendResponse> {
  return apiRequest<OtpSendResponse>('/auth/email/send-otp', {
    method: 'POST',
    body: { email },
  });
}

export function verifyEmailOtp(
  email: string,
  code: string,
): Promise<OtpVerifyResponse> {
  return apiRequest<OtpVerifyResponse>('/auth/email/verify-otp', {
    method: 'POST',
    body: { email, code },
  });
}

export function getMe(token: string): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me', { token });
}

export function updateProfile(
  token: string,
  payload: UpdateProfileRequest,
): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/profile', {
    method: 'PATCH',
    token,
    body: payload,
  });
}

export function updateSettings(
  token: string,
  payload: UpdateUserSettingsRequest,
): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/settings', {
    method: 'PATCH',
    token,
    body: payload,
  });
}

export async function uploadAvatar(
  token: string,
  uri: string,
  mimeType = 'image/jpeg',
): Promise<AuthUser> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    formData.append('avatar', blob, 'avatar.jpg');
  } else {
    formData.append('avatar', {
      uri,
      name: 'avatar.jpg',
      type: mimeType,
    } as unknown as Blob);
  }

  return apiUpload<AuthUser>('/auth/profile/avatar', formData, { token });
}

export function deleteAccount(token: string): Promise<void> {
  return apiRequest<void>('/auth/account', {
    method: 'DELETE',
    token,
  });
}

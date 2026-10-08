import type { SubscriptionSummary } from '../subscriptions/types.js';

export interface AuthUser {
  id: string;
  /** Iranian mobile E.164 when signed in with phone; null for email-only users */
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  avatarUrl: string | null;
  /** Combined first + last name for display */
  displayName: string | null;
  /** Consent to share anonymized data for AI improvements */
  aiDataSharingConsent: boolean;
  subscription: SubscriptionSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

export interface OtpSendResponse {
  expiresIn: number;
  /** Returned only in development */
  devCode?: string;
}

export interface OtpVerifyResponse extends AuthTokens {
  user: AuthUser;
  isNewUser: boolean;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  /** Compatibility with single-field onboarding forms */
  displayName?: string;
}

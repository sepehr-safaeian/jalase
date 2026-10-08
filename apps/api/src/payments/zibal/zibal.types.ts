export interface ZibalRequestPaymentPayload {
  merchant: string;
  amount: number;
  callbackUrl: string;
  description?: string;
  orderId?: string;
  mobile?: string;
}

export interface ZibalRequestPaymentResponse {
  trackId?: number;
  result: number;
  message: string;
}

export interface ZibalVerifyResponse {
  result: number;
  message: string;
  paidAt?: string;
  cardNumber?: string;
  status?: number;
  amount?: number;
  refNumber?: number;
  description?: string;
  orderId?: string;
}

export interface ZibalInquiryResponse {
  result: number;
  message: string;
  status?: number;
  amount?: number;
  orderId?: string;
  createdAt?: string;
  paidAt?: string;
  cardNumber?: string;
  refNumber?: number;
}

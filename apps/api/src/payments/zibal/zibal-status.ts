const ZIBAL_STATUS_MESSAGES: Record<number, string> = {
  [-1]: 'در انتظار پرداخت',
  [-2]: 'خطای داخلی درگاه',
  1: 'پرداخت شده و تایید شده',
  2: 'پرداخت شده، در انتظار تایید',
  3: 'پرداخت لغو شد',
  4: 'شماره کارت نامعتبر است',
  5: 'موجودی حساب کافی نیست',
  6: 'رمز واردشده اشتباه است',
  7: 'تعداد درخواست‌ها بیش از حد مجاز است',
  8: 'تعداد پرداخت روزانه بیش از حد مجاز است',
  9: 'مبلغ پرداخت روزانه بیش از حد مجاز است',
  10: 'صادرکننده کارت نامعتبر است',
  11: 'خطای سوییچ',
  12: 'کارت قابل دسترسی نیست',
  15: 'تراکنش استرداد شده',
  16: 'تراکنش در حال استرداد',
  18: 'تراکنش ریورس شده',
  21: 'پذیرنده نامعتبر است',
};

const ZIBAL_REQUEST_RESULT_MESSAGES: Record<number, string> = {
  100: 'درخواست با موفقیت ثبت شد',
  102: 'مرچنت یافت نشد',
  103: 'مرچنت غیرفعال است',
  104: 'مرچنت نامعتبر است',
  105: 'مبلغ باید بیشتر از ۱٬۰۰۰ ریال باشد',
  106: 'آدرس callback نامعتبر است',
  115: 'آی‌پی سرور در پنل زیبال ثبت نشده است',
};

const ZIBAL_VERIFY_RESULT_MESSAGES: Record<number, string> = {
  100: 'پرداخت با موفقیت تایید شد',
  102: 'مرچنت یافت نشد',
  103: 'مرچنت غیرفعال است',
  104: 'مرچنت نامعتبر است',
  201: 'این پرداخت قبلا تایید شده است',
  202: 'سفارش پرداخت نشده یا ناموفق بوده است',
  203: 'شناسه پیگیری نامعتبر است',
};

export function describeZibalStatus(status: number | undefined): string {
  if (status === undefined) {
    return 'وضعیت پرداخت نامشخص است';
  }
  return ZIBAL_STATUS_MESSAGES[status] ?? 'خطای نامشخص در پرداخت';
}

export function describeZibalRequestResult(result: number): string {
  return ZIBAL_REQUEST_RESULT_MESSAGES[result] ?? `خطای درگاه (کد ${result})`;
}

export function describeZibalVerifyResult(result: number): string {
  return ZIBAL_VERIFY_RESULT_MESSAGES[result] ?? `خطای تایید پرداخت (کد ${result})`;
}

export function isUserCancelledStatus(status: number | undefined): boolean {
  return status === 3;
}

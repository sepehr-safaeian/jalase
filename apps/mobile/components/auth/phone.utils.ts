/** تبدیل شماره ایرانی به E.164 (+98...) */
export function toIranE164(input: string): string | null {
  const digits = input.replace(/\D/g, '');

  if (/^09\d{9}$/.test(digits)) {
    return `+98${digits.slice(1)}`;
  }

  if (/^9\d{9}$/.test(digits)) {
    return `+98${digits}`;
  }

  if (/^989\d{9}$/.test(digits)) {
    return `+${digits}`;
  }

  if (/^\+989\d{9}$/.test(input.trim())) {
    return input.trim();
  }

  return null;
}

export function isValidIranPhone(input: string): boolean {
  return toIranE164(input) !== null;
}

/** نمایش شماره به فرمت ۰۹۱۵ ۷۰۸ ۱۱۶۸ با جهت LTR */
export function formatIranPhoneDisplay(input: string): string {
  const digits = input.replace(/\D/g, '');

  let local = digits;
  if (/^989\d{9}$/.test(digits)) {
    local = `0${digits.slice(2)}`;
  } else if (/^9\d{9}$/.test(digits)) {
    local = `0${digits}`;
  }

  if (/^09\d{9}$/.test(local)) {
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  }

  return input.trim();
}

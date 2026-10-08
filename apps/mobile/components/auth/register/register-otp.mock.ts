/** Mock OTP service — جایگزین با API واقعی */

const MOCK_CODE = '123456';
const pendingPhones = new Set<string>();

export async function sendRegisterOtp(phoneE164: string): Promise<void> {
  await delay(800);
  pendingPhones.add(phoneE164);
}

export async function verifyRegisterOtp(
  phoneE164: string,
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  await delay(600);

  if (!pendingPhones.has(phoneE164)) {
    return { ok: false, error: 'ابتدا کد را درخواست کنید' };
  }

  if (code.length !== 6) {
    return { ok: false, error: 'کد ۶ رقمی را کامل وارد کنید' };
  }

  if (code !== MOCK_CODE) {
    return { ok: false, error: 'کد وارد شده نادرست است' };
  }

  pendingPhones.delete(phoneE164);
  return { ok: true };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getMockOtpHint(): string {
  return `محیط توسعه: کد ${MOCK_CODE}`;
}

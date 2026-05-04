import crypto from 'crypto';

const OTP_SECRET = process.env.OTP_SECRET!;
const SESSION_SECRET = process.env.SESSION_SECRET!;

export function hashPhone(phone: string): string {
  return crypto
    .createHmac('sha256', OTP_SECRET)
    .update(phone.replace(/\s+/g, ''))
    .digest('hex');
}

export function hashOtp(otp: string): string {
  return crypto
    .createHmac('sha256', OTP_SECRET)
    .update(otp)
    .digest('hex');
}

export function generateOtp(): string {
  // 6 digit, cryptographically random
  const bytes = crypto.randomBytes(3);
  const num = (bytes.readUIntBE(0, 3) % 900000) + 100000;
  return num.toString();
}

export function generateSessionToken(claimId: string, phone: string): string {
  const payload = `${claimId}:${phone}:${Date.now()}`;
  return crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('hex');
}

export function formatPhone(raw: string, countryCode: string = '+234'): string {
  const digits = raw.replace(/\D/g, '');
  // Strip leading zero if present
  const stripped = digits.startsWith('0') ? digits.slice(1) : digits;
  return `${countryCode}${stripped}`;
}

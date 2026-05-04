import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_NUMBER!;
const SMS_FROM = process.env.TWILIO_PHONE_NUMBER!;

export async function sendOtpWhatsApp(to: string, otp: string): Promise<boolean> {
  try {
    await client.messages.create({
      from: WHATSAPP_FROM,
      to: `whatsapp:${to}`,
      body: `Your PayLink code is *${otp}*\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
    });
    return true;
  } catch (err) {
    console.error('WhatsApp send failed:', err);
    return false;
  }
}

export async function sendOtpSms(to: string, otp: string): Promise<boolean> {
  try {
    await client.messages.create({
      from: SMS_FROM,
      to,
      body: `Your PayLink code is ${otp}. Expires in 10 minutes. Do not share.`,
    });
    return true;
  } catch (err) {
    console.error('SMS send failed:', err);
    return false;
  }
}

export async function sendOtp(to: string, otp: string): Promise<'whatsapp' | 'sms' | null> {
  const whatsappSent = await sendOtpWhatsApp(to, otp);
  if (whatsappSent) return 'whatsapp';

  const smsSent = await sendOtpSms(to, otp);
  if (smsSent) return 'sms';

  return null;
}

import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const secretKey = process.env.MOONPAY_SECRET_KEY;
    
    if (!secretKey) {
      console.error('MOONPAY_SECRET_KEY is not configured');
      // In development, return the URL as-is or throw an error based on strictness.
      // For testing without keys, we'll just return the original URL so the widget still renders.
      return NextResponse.json({ signedUrl: url });
    }

    // Generate HMAC-SHA256 signature
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(new URL(url).search)
      .digest('base64');

    // Append signature to URL
    const signedUrl = `${url}&signature=${encodeURIComponent(signature)}`;

    return NextResponse.json({ signedUrl });
  } catch (error) {
    console.error('MoonPay signature error:', error);
    return NextResponse.json({ error: 'Failed to sign URL' }, { status: 500 });
  }
}

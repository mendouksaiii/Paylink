'use client';

interface MoonpayWidgetProps {
  amount: number;
  sessionToken?: string;
  walletAddress?: string;
}

export function MoonpayWidget({ amount, sessionToken, walletAddress }: MoonpayWidgetProps) {
  const params = new URLSearchParams({
    apiKey: process.env.NEXT_PUBLIC_MOONPAY_PK!,
    baseCurrencyCode: 'usdc',
    baseCurrencyAmount: amount.toString(),
    colorCode: '%232563eb',
    language: 'en',
  });

  if (walletAddress) params.set('walletAddress', walletAddress);

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      <iframe
        src={`https://sell-sandbox.moonpay.com?${params.toString()}`}
        className="w-full h-[500px]"
        allow="accelerometer; autoplay; camera; gyroscope; payment"
      />
    </div>
  );
}

'use client';

import { MoonPaySellWidget } from '@moonpay/moonpay-react';

interface MoonpayWidgetProps {
  amount: number;
  sessionToken?: string;
  walletAddress?: string;
}

export function MoonpayWidget({ amount, sessionToken, walletAddress }: MoonpayWidgetProps) {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm" style={{ height: '500px', backgroundColor: '#ffffff' }}>
      <MoonPaySellWidget
        variant="embedded"
        baseCurrencyCode="usdc"
        baseCurrencyAmount={amount.toString()}
        colorCode="#00C853"
        language="en"
        signatureEndpointUrl="/api/moonpay-sign"
      />
    </div>
  );
}

'use client';
import { useState } from 'react';

const COUNTRY_CODES = [
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+27',  flag: '🇿🇦', name: 'South Africa' },
  { code: '+55',  flag: '🇧🇷', name: 'Brazil' },
  { code: '+91',  flag: '🇮🇳', name: 'India' },
  { code: '+1',   flag: '🇺🇸', name: 'USA' },
  { code: '+44',  flag: '🇬🇧', name: 'UK' },
];

interface PhoneInputProps {
  value: string;
  countryCode: string;
  onValueChange: (val: string) => void;
  onCountryChange: (code: string) => void;
}

export function PhoneInput({
  value,
  countryCode,
  onValueChange,
  onCountryChange,
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const selected = COUNTRY_CODES.find(c => c.code === countryCode) ?? COUNTRY_CODES[0];

  return (
    <div className="relative w-full max-w-sm">
      <div className="flex rounded-2xl border border-gray-200 overflow-hidden focus-within:border-blue-500 transition-colors">
        {/* Country selector */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 px-4 py-4 bg-gray-50 border-r border-gray-200 text-gray-700 shrink-0"
        >
          <span className="text-xl">{selected.flag}</span>
          <span className="text-sm font-medium">{selected.code}</span>
          <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Number input */}
        <input
          type="tel"
          inputMode="numeric"
          placeholder="8012345678"
          value={value}
          onChange={e => onValueChange(e.target.value.replace(/\D/g, ''))}
          className="flex-1 px-4 py-4 outline-none text-lg bg-white"
          autoFocus
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-2xl shadow-lg z-50 overflow-hidden">
          {COUNTRY_CODES.map(c => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                onCountryChange(c.code);
                setOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 text-left"
            >
              <span className="text-xl">{c.flag}</span>
              <span className="text-sm text-gray-700">{c.name}</span>
              <span className="text-sm text-gray-400 ml-auto">{c.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

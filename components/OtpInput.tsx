'use client';
import { useRef, useEffect } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  length?: number;
}

export function OtpInput({ value, onChange, length = 6 }: OtpInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="w-full max-w-sm">
      {/* Hidden real input */}
      <input
        ref={inputRef}
        type="number"
        inputMode="numeric"
        value={value}
        onChange={e => {
          const val = e.target.value.replace(/\D/g, '').slice(0, length);
          onChange(val);
        }}
        className="sr-only"
      />

      {/* Visual boxes */}
      <div
        className="flex gap-3 justify-center cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={`
              w-12 h-14 flex items-center justify-center
              text-2xl font-bold rounded-xl border-2 transition-colors
              ${i === value.length
                ? 'border-blue-500 bg-blue-50'
                : value[i]
                  ? 'border-gray-300 bg-white'
                  : 'border-gray-200 bg-gray-50'
              }
            `}
          >
            {value[i] ?? ''}
          </div>
        ))}
      </div>
    </div>
  );
}

import React from 'react';
import { Voucher } from '@/types';

interface DigitSlotsDisplayProps {
  displayDigits: string;
  isRolling: boolean;
  winnerVoucher: Voucher | null;
}

export const DigitSlotsDisplay: React.FC<DigitSlotsDisplayProps> = ({
  displayDigits,
  isRolling,
  winnerVoucher,
}) => {
  return (
    <div className="py-4">
      <div className="inline-flex items-center justify-center gap-3 sm:gap-6 bg-slate-950/90 border-4 border-slate-800 p-4 sm:p-8 rounded-3xl shadow-inner max-w-full">
        {displayDigits.split('').map((digit, idx) => (
          <div
            key={idx}
            className={`w-14 h-20 sm:w-24 sm:h-36 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 ${
              winnerVoucher
                ? 'border-amber-400 text-amber-400 shadow-lg shadow-amber-500/50 scale-105'
                : isRolling
                ? 'border-red-500 text-white animate-pulse'
                : 'border-slate-700 text-slate-200'
            } flex items-center justify-center font-mono text-4xl sm:text-7xl font-black tracking-tighter shadow-2xl transition-all`}
          >
            {digit}
          </div>
        ))}
      </div>
    </div>
  );
};

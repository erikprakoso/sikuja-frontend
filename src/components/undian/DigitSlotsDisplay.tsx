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
      <div className="inline-flex items-center justify-center gap-3 sm:gap-6 bg-white border-4 border-[#E70013] p-4 sm:p-8 rounded-3xl shadow-lg max-w-full">
        {displayDigits.split('').map((digit, idx) => (
          <div
            key={idx}
            className={`w-14 h-20 sm:w-24 sm:h-36 rounded-2xl bg-white border-4 ${
              winnerVoucher
                ? 'border-[#E70013] text-white bg-[#E70013] shadow-lg scale-105'
                : isRolling
                ? 'border-[#E70013] text-[#E70013] animate-pulse'
                : 'border-[#E70013] text-[#E70013]'
            } flex items-center justify-center font-mono text-4xl sm:text-7xl font-black tracking-tighter shadow-xl transition-all`}
          >
            {digit}
          </div>
        ))}
      </div>
    </div>
  );
};

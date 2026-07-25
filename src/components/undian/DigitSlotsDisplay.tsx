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
    <div className="py-6">
      <div
        className={`inline-flex items-center justify-center gap-2 sm:gap-4 p-4 sm:p-8 rounded-3xl max-w-full transition-all duration-500 ${
          winnerVoucher
            ? 'bg-[#E70013]'
            : 'bg-white border-4 border-[#E70013]'
        }`}
      >
        {displayDigits.split('').map((digit, idx) => (
          <div
            key={idx}
            style={{ animationDelay: `${idx * 60}ms` }}
            className={`
              w-12 h-18 sm:w-24 sm:h-36
              rounded-2xl
              flex items-center justify-center
              font-mono font-black
              text-4xl sm:text-7xl
              tracking-tighter
              select-none
              transition-all duration-300
              shadow-md
              ${winnerVoucher
                ? 'bg-white text-[#E70013] shadow-lg scale-110'
                : isRolling
                  ? 'bg-[#E70013]/10 text-[#E70013] blur-[0.5px] scale-95 animate-bounce border-2 border-[#E70013]'
                  : 'bg-white border-4 border-[#E70013] text-[#E70013] scale-100'
              }
            `}
          >
            {digit}
          </div>
        ))}
      </div>

      {isRolling && (
        <p className="mt-3 text-xs font-black text-[#E70013] uppercase tracking-widest animate-pulse">
          ⟳ Mengacak kode kupon...
        </p>
      )}
    </div>
  );
};

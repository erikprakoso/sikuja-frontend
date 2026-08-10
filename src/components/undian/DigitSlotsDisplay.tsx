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
    <div className="py-6 flex items-center justify-center">
      <div className="flex flex-col items-center w-full">
        <div
          className={`inline-flex items-center justify-center gap-2 sm:gap-4 p-3 sm:p-6 rounded-3xl max-w-full relative ${
            winnerVoucher
              ? 'bg-[#E70013] shadow-2xl ring-4 ring-[#E70013]/40'
              : 'bg-white border-4 border-[#E70013] shadow-xl'
          }`}
        >
          {displayDigits.split('').map((digit, idx) => (
            <div
              key={idx}
              style={{ animationDelay: `${idx * 60}ms` }}
              className={`
                w-12 h-16 sm:w-24 sm:h-32 lg:w-16 lg:h-20 xl:w-20 xl:h-28
                rounded-2xl
                flex items-center justify-center
                font-mono font-black
                text-4xl sm:text-7xl lg:text-4xl xl:text-6xl
                tracking-tighter
                select-none
                shadow-md
                ${winnerVoucher
                  ? 'bg-white text-[#E70013] shadow-lg'
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
    </div>
  );
};

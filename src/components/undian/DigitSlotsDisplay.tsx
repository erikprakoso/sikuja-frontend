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
    <div className="py-6 flex items-center justify-center w-full">
      <div className="flex flex-col items-center w-full">
        <div
          className={`flex items-stretch justify-center gap-1.5 sm:gap-3 p-2 sm:p-4 rounded-3xl w-full ${
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
                flex-1 h-24 sm:h-40 md:h-56 lg:h-40 xl:h-56 2xl:h-64
                rounded-2xl
                overflow-hidden
                grid place-items-center text-center
                font-mono font-black leading-none
                text-5xl sm:text-[7rem] md:text-[8rem] lg:text-[6rem] xl:text-[9rem] 2xl:text-[10rem]
                select-none
                shadow-md
                ${winnerVoucher
                  ? 'bg-white text-[#E70013] shadow-lg'
                  : isRolling
                    ? 'bg-[#E70013]/10 text-[#E70013] border-2 border-[#E70013] animate-pulse'
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

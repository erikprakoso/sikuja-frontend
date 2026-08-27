import React from 'react';
import { Voucher } from '@/types';

interface DigitSlotsDisplayProps {
  displayDigits: string;
  isRolling: boolean;
  winnerVoucher: Voucher | null;
  ownerName?: string | null;
}

export const DigitSlotsDisplay: React.FC<DigitSlotsDisplayProps> = ({
  displayDigits,
  isRolling,
  winnerVoucher,
  ownerName,
}) => {
  return (
    <div className="py-6 flex items-center justify-center w-full">
      <div className="flex flex-col items-center w-full">
        <div
          className={`flex items-stretch justify-center gap-1.5 sm:gap-3 p-2 sm:p-4 rounded-3xl w-full border-4 ${
            winnerVoucher
              ? 'bg-yellow-400 border-yellow-400 shadow-2xl ring-4 ring-yellow-400/50'
              : 'bg-black border-yellow-400 shadow-xl'
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
                border-4
                ${winnerVoucher
                  ? 'bg-black text-yellow-400 border-yellow-400 shadow-lg'
                  : isRolling
                    ? 'bg-yellow-400 text-black border-yellow-400 animate-pulse'
                    : 'bg-zinc-900 text-yellow-400 border-yellow-400 scale-100'
                }
              `}
            >
              {digit}
            </div>
          ))}
        </div>

        {isRolling && (
          <p className="mt-3 text-sm font-black text-yellow-400 uppercase tracking-widest animate-pulse">
            ⟳ Mengacak kode kupon...
          </p>
        )}

        {!isRolling && ownerName && (
          <div className="mt-3 w-full max-w-md mx-auto px-4 py-3 rounded-xl bg-black border-2 border-yellow-400">
            <p className="text-[11px] font-black text-yellow-400 uppercase tracking-widest text-center">
              Pemilik Kupon
            </p>
            <p className="text-base sm:text-xl font-black text-white text-center">
              {ownerName}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

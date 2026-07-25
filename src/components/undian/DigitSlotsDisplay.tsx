import React from 'react';
import { Voucher } from '@/types';
import { Sparkles, Flame } from 'lucide-react';

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
    <div className="py-6 flex items-center justify-center gap-3 sm:gap-6 relative">
      {/* Left Stage Side Flare Column */}
      <div className="hidden md:flex flex-col items-center justify-center gap-3 opacity-90">
        <div
          className={`w-12 sm:w-16 h-48 sm:h-56 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all duration-300 ${
            winnerVoucher
              ? 'bg-[#E70013] border-[#E70013] text-white shadow-xl animate-bounce'
              : isRolling
              ? 'bg-[#E70013]/20 border-[#E70013] text-[#E70013] animate-pulse shadow-lg'
              : 'bg-white border-[#E70013]/30 text-[#E70013]'
          }`}
        >
          <Sparkles className={`w-7 h-7 ${isRolling ? 'animate-spin' : 'animate-pulse'}`} />
          <Flame className="w-6 h-6 animate-bounce" />
          <span className="text-[10px] font-black uppercase tracking-widest [writing-mode:vertical-lr] rotate-180">
            Jalan Sehat 2026
          </span>
        </div>
      </div>

      {/* Main 5-Digit Display Slot Screen */}
      <div className="flex flex-col items-center">
        <div
          className={`inline-flex items-center justify-center gap-2 sm:gap-4 p-4 sm:p-8 rounded-3xl max-w-full transition-all duration-500 relative ${
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

      {/* Right Stage Side Flare Column */}
      <div className="hidden md:flex flex-col items-center justify-center gap-3 opacity-90">
        <div
          className={`w-12 sm:w-16 h-48 sm:h-56 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all duration-300 ${
            winnerVoucher
              ? 'bg-[#E70013] border-[#E70013] text-white shadow-xl animate-bounce'
              : isRolling
              ? 'bg-[#E70013]/20 border-[#E70013] text-[#E70013] animate-pulse shadow-lg'
              : 'bg-white border-[#E70013]/30 text-[#E70013]'
          }`}
        >
          <Sparkles className={`w-7 h-7 ${isRolling ? 'animate-spin' : 'animate-pulse'}`} />
          <Flame className="w-6 h-6 animate-bounce" />
          <span className="text-[10px] font-black uppercase tracking-widest [writing-mode:vertical-lr]">
            Jalan Sehat 2026
          </span>
        </div>
      </div>
    </div>
  );
};

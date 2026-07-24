import React from 'react';
import { Voucher } from '@/types';
import { Sparkles } from 'lucide-react';

interface WinnerBannerProps {
  winnerVoucher: Voucher;
}

export const WinnerBanner: React.FC<WinnerBannerProps> = ({ winnerVoucher }) => {
  return (
    <div className="p-6 rounded-3xl bg-amber-500/20 border border-amber-400/60 max-w-xl mx-auto space-y-2 animate-bounce-subtle shadow-2xl">
      <div className="inline-flex items-center gap-2 text-amber-300 font-extrabold text-sm uppercase">
        <Sparkles className="w-5 h-5" />
        Pemenang Sah Ditarik!
      </div>
      <p className="text-3xl font-black text-white font-mono tracking-widest">
        KODE VOUCHER: {winnerVoucher.code}
      </p>
      <p className="text-xs text-amber-200">
        Silakan pemegang voucher maju ke panggung dengan membawa bukti fisik / e-voucher!
      </p>
    </div>
  );
};

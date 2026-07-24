import React from 'react';
import { Voucher } from '@/types';
import { Play, RotateCcw } from 'lucide-react';

interface DrawControlsProps {
  isRolling: boolean;
  winnerVoucher: Voucher | null;
  onStartDraw: (isForfeit?: boolean) => void;
}

export const DrawControls: React.FC<DrawControlsProps> = ({
  isRolling,
  winnerVoucher,
  onStartDraw,
}) => {
  return (
    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
      {winnerVoucher ? (
        <>
          <button
            onClick={() => onStartDraw(false)}
            disabled={isRolling}
            className="px-8 py-4 rounded-2xl text-base font-black tracking-wide shadow-xl bg-gradient-to-r from-red-600 to-red-500 text-white hover:scale-105 transition-all flex items-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" />
            Kocok Lagi Hadiah Berikutnya
          </button>

          <button
            onClick={() => onStartDraw(true)}
            disabled={isRolling}
            className="px-8 py-4 rounded-2xl text-base font-black tracking-wide shadow-xl bg-amber-950 border border-amber-500 text-amber-300 hover:bg-amber-900 hover:scale-105 transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            🔴 Gugurkan & Tarik Ulang (Peserta Tidak Hadir)
          </button>
        </>
      ) : (
        <button
          onClick={() => onStartDraw(false)}
          disabled={isRolling}
          className={`px-10 py-5 rounded-2xl text-xl font-black tracking-wide shadow-2xl transition-all flex items-center gap-3 ${
            isRolling
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-600 via-amber-500 to-red-600 hover:scale-105 text-slate-950 shadow-amber-500/40 ring-4 ring-amber-400/30'
          }`}
        >
          <Play className="w-6 h-6 fill-current" />
          {isRolling ? 'Mengocok Kode...' : 'Kocok / Tarik Kode!'}
        </button>
      )}
    </div>
  );
};

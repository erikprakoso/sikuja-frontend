import React from 'react';
import { Voucher } from '@/types';
import { Play, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

interface DrawControlsProps {
  isRolling: boolean;
  isConfirming: boolean;
  candidateVoucher: Voucher | null;
  isConfirmed: boolean;
  onStartDraw: () => void;
  onConfirmWinner: () => void;
  onForfeitAndRedraw: () => void;
}

export const DrawControls: React.FC<DrawControlsProps> = ({
  isRolling,
  isConfirming,
  candidateVoucher,
  isConfirmed,
  onStartDraw,
  onConfirmWinner,
  onForfeitAndRedraw,
}) => {
  return (
    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
      {candidateVoucher ? (
        isConfirmed ? (
          /* Confirmed Winner State */
          <button
            onClick={onStartDraw}
            disabled={isRolling}
            className="px-8 py-4 rounded-2xl text-base font-black tracking-wide shadow-xl bg-gradient-to-r from-red-600 to-amber-500 text-white hover:scale-105 transition-all flex items-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" />
            Kocok Hadiah Berikutnya
          </button>
        ) : (
          /* Candidate Drawn - Pending Presence Verification */
          <>
            <button
              onClick={onConfirmWinner}
              disabled={isConfirming}
              className="px-8 py-4 rounded-2xl text-base font-black tracking-wide shadow-xl bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105 transition-all flex items-center gap-2 ring-4 ring-emerald-400/30"
            >
              <CheckCircle className="w-5 h-5" />
              {isConfirming ? 'Menyahkan...' : '✅ Sahkan & Pemenang Maju'}
            </button>

            <button
              onClick={onForfeitAndRedraw}
              disabled={isConfirming}
              className="px-8 py-4 rounded-2xl text-base font-black tracking-wide shadow-xl bg-red-950 border border-red-500 text-red-300 hover:bg-red-900 hover:scale-105 transition-all flex items-center gap-2"
            >
              <XCircle className="w-5 h-5 text-red-400" />
              🔴 Peserta Tidak Hadir (Gugur & Kocok Ulang)
            </button>
          </>
        )
      ) : (
        /* Default Roll Button */
        <button
          onClick={onStartDraw}
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

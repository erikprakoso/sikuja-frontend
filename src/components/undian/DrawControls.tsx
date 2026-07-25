import React from 'react';
import { Voucher } from '@/types';
import { Play, CheckCircle, XCircle } from 'lucide-react';

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
            className="px-8 py-4 rounded-2xl text-base font-black tracking-wide shadow-xl bg-[#E70013] text-white hover:scale-105 active:scale-95 cursor-pointer transition-all flex items-center gap-2 border-2 border-[#E70013] disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5 fill-current" />
            Undi Hadiah Berikutnya
          </button>
        ) : (
          /* Candidate Drawn - Pending Presence Verification */
          <>
            <button
              onClick={onConfirmWinner}
              disabled={isConfirming}
              className="px-8 py-4 rounded-2xl text-base font-black tracking-wide shadow-xl bg-[#E70013] text-white hover:scale-105 active:scale-95 cursor-pointer transition-all flex items-center gap-2 border-2 border-[#E70013] disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5" />
              {isConfirming ? 'Mengonfirmasi...' : 'Konfirmasi Pemenang'}
            </button>

            <button
              onClick={onForfeitAndRedraw}
              disabled={isConfirming}
              className="px-8 py-4 rounded-2xl text-base font-black tracking-wide shadow-xl bg-white border-2 border-[#E70013] text-[#E70013] hover:bg-[#E70013] hover:text-white hover:scale-105 active:scale-95 cursor-pointer transition-all flex items-center gap-2 disabled:cursor-not-allowed"
            >
              <XCircle className="w-5 h-5" />
              Gugurkan & Undi Ulang
            </button>
          </>
        )
      ) : (
        /* Default Roll Button */
        <button
          onClick={onStartDraw}
          disabled={isRolling}
          className={`px-10 py-5 rounded-2xl text-xl font-black tracking-wide shadow-xl transition-all flex items-center gap-3 border-2 border-[#E70013] ${
            isRolling
              ? 'bg-white text-[#E70013] opacity-50 cursor-not-allowed'
              : 'bg-[#E70013] hover:scale-105 active:scale-95 cursor-pointer text-white shadow-lg'
          }`}
        >
          <Play className="w-6 h-6 fill-current" />
          {isRolling ? 'Memutar Kode Kupon...' : 'Mulai Pengundian'}
        </button>
      )}
    </div>
  );
};

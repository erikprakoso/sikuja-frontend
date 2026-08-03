import React from 'react';
import { Voucher } from '@/types';
import { Play, Square, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface DrawControlsProps {
  isRolling: boolean;
  isConfirming: boolean;
  candidateVoucher: Voucher | null;
  isConfirmed: boolean;
  selectedPrizeId: string;
  onStartDraw: () => void;
  onStopDraw: () => void;
  onConfirmWinner: () => void;
  onForfeitAndRedraw: () => void;
}

export const DrawControls: React.FC<DrawControlsProps> = ({
  isRolling,
  isConfirming,
  candidateVoucher,
  isConfirmed,
  selectedPrizeId,
  onStartDraw,
  onStopDraw,
  onConfirmWinner,
  onForfeitAndRedraw,
}) => {
  const canStart = !!selectedPrizeId && !isRolling;

  return (
    <div className="pt-6 flex flex-col items-center justify-center gap-4">
      {candidateVoucher ? (
        isConfirmed ? (
          /* ── Confirmed Winner: Next Draw CTA ── */
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => onStartDraw()}
              disabled={isRolling}
              className="group px-10 py-4 rounded-2xl text-base font-black tracking-wide bg-[#E70013] text-white border-2 border-[#E70013] shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer transition-all duration-200 flex items-center gap-2.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="w-5 h-5 fill-current group-hover:translate-x-0.5 transition-transform" />
              Undi Hadiah Berikutnya
            </button>
            <p className="text-[10px] font-bold text-slate-500">
              atau tekan <kbd className="px-1.5 py-0.5 rounded border border-slate-300 bg-slate-100 text-slate-700 text-[10px] font-black">Spasi</kbd>
            </p>
          </div>
        ) : (
          /* ── Candidate Pending: Confirm or Forfeit ── */
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xl">
            {/* Primary: Confirm */}
            <button
              onClick={onConfirmWinner}
              disabled={isConfirming}
              className="flex-1 py-4 px-8 rounded-2xl text-base font-black tracking-wide bg-[#E70013] text-white border-2 border-[#E70013] shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer transition-all duration-200 flex items-center justify-center gap-2.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isConfirming ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              {isConfirming ? 'Mengonfirmasi...' : 'Konfirmasi Pemenang'}
              {!isConfirming && (
                <kbd className="px-1.5 py-0.5 rounded border border-white/40 bg-white/15 text-white text-[10px] font-black">Y</kbd>
              )}
            </button>

            {/* Divider */}
            <span className="text-[#E70013]/40 font-bold text-sm hidden sm:block">atau</span>

            {/* Secondary: Forfeit */}
            <button
              onClick={onForfeitAndRedraw}
              disabled={isConfirming}
              className="flex-1 py-4 px-8 rounded-2xl text-base font-black tracking-wide bg-white text-[#E70013] border-2 border-[#E70013] hover:bg-[#E70013] hover:text-white hover:scale-105 active:scale-95 cursor-pointer transition-all duration-200 flex items-center justify-center gap-2.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <XCircle className="w-5 h-5" />
              Gugurkan & Undi Ulang
              <kbd className="px-1.5 py-0.5 rounded border border-[#E70013]/40 bg-[#E70013]/10 text-[#E70013] text-[10px] font-black">N</kbd>
            </button>
          </div>
        )
      ) : (
        /* ── Default: Main Draw CTA ── */
        <div className="flex flex-col items-center gap-3">
          {!selectedPrizeId && (
            <div className="flex items-center gap-2 text-sm font-bold text-[#E70013] bg-[#E70013]/8 border border-[#E70013]/25 px-5 py-2.5 rounded-xl">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Pilih kategori hadiah terlebih dahulu
            </div>
          )}

          {/* Big Stage CTA Button: starts OR stops the roll */}
          <button
            onClick={isRolling ? () => onStopDraw() : () => onStartDraw()}
            disabled={!canStart && !isRolling}
            className={`px-14 py-6 rounded-3xl text-2xl font-black tracking-wide transition-all duration-300 flex items-center gap-4 shadow-xl
              ${!canStart && !isRolling
                ? 'bg-white text-[#E70013]/40 border-4 border-[#E70013]/30 cursor-not-allowed'
                : isRolling
                  ? 'bg-slate-900 text-white border-4 border-slate-900 cursor-pointer hover:scale-105 active:scale-95 hover:shadow-2xl'
                  : 'bg-[#E70013] text-white border-4 border-[#E70013] cursor-pointer hover:scale-105 active:scale-95 hover:shadow-2xl'
              }`}
          >
            {isRolling ? (
              <>
                <Square className="w-7 h-7 fill-current" />
                Stop Undian
              </>
            ) : (
              <>
                <Play className="w-7 h-7 fill-current" />
                Mulai Pengundian
              </>
            )}
          </button>

          {canStart && (
            <p className="text-[10px] font-bold text-slate-500">
              Tekan <kbd className="px-1.5 py-0.5 rounded border border-slate-300 bg-slate-100 text-slate-700 text-[10px] font-black">Spasi</kbd> untuk memulai
            </p>
          )}

          {isRolling && (
            <p className="text-[10px] font-bold text-slate-500">
              Tekan <kbd className="px-1.5 py-0.5 rounded border border-slate-300 bg-slate-100 text-slate-700 text-[10px] font-black">Spasi</kbd> untuk berhenti
            </p>
          )}
        </div>
      )}
    </div>
  );
};

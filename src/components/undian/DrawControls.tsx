import React from 'react';
import { Voucher } from '@/types';
import { Play, Square, CheckCircle, XCircle, Loader2 } from 'lucide-react';

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
  const canStart = !!selectedPrizeId;

  // Kandidat tampil: pilih Konfirmasi atau Gugurkan
  if (candidateVoucher && !isConfirmed) {
    return (
      <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 w-full max-w-md mx-auto">
        <button
          onClick={onConfirmWinner}
          disabled={isConfirming}
          className="flex-1 px-4 py-3 rounded-xl font-bold text-base bg-[#E70013] text-white hover:opacity-90 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isConfirming ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          {isConfirming ? 'Konfirmasi...' : 'Konfirmasi'}
        </button>
        <button
          onClick={onForfeitAndRedraw}
          disabled={isConfirming}
          className="flex-1 px-4 py-3 rounded-xl font-bold text-base bg-white text-[#E70013] border-2 border-[#E70013] hover:bg-[#E70013]/5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <XCircle className="w-4 h-4" />
          Gugurkan
        </button>
      </div>
    );
  }

  // Pemenang terkonfirmasi: undi hadiah berikutnya
  if (candidateVoucher && isConfirmed) {
    return (
      <button
        onClick={onStartDraw}
        className="w-full max-w-md mx-auto px-4 py-3 rounded-xl font-bold text-base bg-[#E70013] text-white hover:opacity-90 cursor-pointer flex items-center justify-center gap-2"
      >
        <Play className="w-4 h-4 fill-current" />
        Undi Berikutnya
      </button>
    );
  }

  // Layar utama: tombol Mulai / Stop
  return (
    <button
      onClick={isRolling ? onStopDraw : onStartDraw}
      disabled={!canStart}
      className={`w-full max-w-md mx-auto px-4 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed ${
        !canStart
          ? 'bg-slate-100 text-slate-400'
          : isRolling
            ? 'bg-slate-900 text-white hover:opacity-90'
            : 'bg-[#E70013] text-white hover:opacity-90'
      }`}
    >
      {isRolling ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
      {isRolling ? 'Stop' : 'Mulai'}
    </button>
  );
};

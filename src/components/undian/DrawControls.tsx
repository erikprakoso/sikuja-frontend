import React from 'react';
import { Voucher } from '@/types';
import { Play, Square, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface DrawControlsProps {
  isRolling: boolean;
  isStarting?: boolean;
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
  isStarting = false,
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

  // Saat menyiapkan pool (fetch /api/draw) - jangan tampilkan Mulai agar tidak kedip setelah Undi Berikutnya
  if (isStarting) {
    return (
      <button
        disabled
        className="w-full max-w-md mx-auto px-4 py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 cursor-wait disabled:cursor-wait border-2 shadow-lg bg-zinc-800 text-zinc-400 border-zinc-700"
      >
        <Loader2 className="w-5 h-5 animate-spin" />
        Menyiapkan Undian...
      </button>
    );
  }

  // Kandidat tampil: pilih Konfirmasi atau Gugurkan
  if (candidateVoucher && !isConfirmed) {
    return (
      <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 w-full max-w-md mx-auto">
        <button
          onClick={onConfirmWinner}
          disabled={isConfirming}
          className="flex-1 px-4 py-4 rounded-xl font-black text-base bg-yellow-400 text-black border-4 border-yellow-400 hover:brightness-110 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg"
        >
          {isConfirming ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          {isConfirming ? 'Konfirmasi...' : 'Konfirmasi'}
        </button>
        <button
          onClick={onForfeitAndRedraw}
          disabled={isConfirming}
          className="flex-1 px-4 py-4 rounded-xl font-black text-base bg-zinc-800 text-zinc-200 border-2 border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 hover:text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <XCircle className="w-5 h-5" />
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
        className="w-full max-w-md mx-auto px-4 py-4 rounded-xl font-black text-base bg-yellow-400 text-black border-4 border-yellow-400 hover:brightness-110 cursor-pointer flex items-center justify-center gap-2 shadow-lg"
      >
        <Play className="w-5 h-5 fill-current" />
        Undi Berikutnya
      </button>
    );
  }

  // Layar utama: tombol Mulai / Stop - outdoor high-contrast tanpa merah/putih
  return (
    <button
      onClick={isRolling ? onStopDraw : onStartDraw}
      disabled={!canStart}
      className={`w-full max-w-md mx-auto px-4 py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed border-2 shadow-lg transition-colors ${
        !canStart
          ? 'bg-zinc-800 text-zinc-500 border-zinc-700'
          : isRolling
            ? 'bg-zinc-900 text-yellow-400 border-yellow-400 hover:bg-black'
            : 'bg-yellow-400 text-black border-yellow-400 hover:brightness-110'
      }`}
    >
      {isRolling ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
      {isRolling ? 'Stop' : 'Mulai Undian'}
    </button>
  );
};

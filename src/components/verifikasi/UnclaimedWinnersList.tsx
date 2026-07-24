import React from 'react';
import { DrawResult } from '@/types';
import { Trophy, CheckCircle2 } from 'lucide-react';

interface UnclaimedWinnersListProps {
  unclaimedWinners: DrawResult[];
  onQuickClaim: (code: string) => void;
}

export const UnclaimedWinnersList: React.FC<UnclaimedWinnersListProps> = ({
  unclaimedWinners,
  onQuickClaim,
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-400" />
        Daftar Pemenang yang Belum Diklaim ({unclaimedWinners.length})
      </h2>

      {unclaimedWinners.length === 0 ? (
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
          Tidak ada pemenang yang menggantung (semua pemenang sudah diklaim / belum ada kocokan).
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {unclaimedWinners.map((res) => (
            <div
              key={res.id}
              className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-lg flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-amber-400">
                  Hadiah: {res.prize_name}
                </span>
                <p className="text-2xl font-black text-white font-mono tracking-widest">
                  {res.voucher_code}
                </p>
                <p className="text-[10px] text-slate-400">
                  Ditarik: {new Date(res.drawn_at).toLocaleTimeString('id-ID')}
                </p>
              </div>

              <button
                onClick={() => onQuickClaim(res.voucher_code)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 flex-shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                Klaim Hadiah
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

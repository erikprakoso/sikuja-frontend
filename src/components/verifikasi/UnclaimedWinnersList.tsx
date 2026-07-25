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
      <h2 className="text-xs font-bold uppercase tracking-wider text-[#E70013]/80 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-[#E70013]" />
        Daftar Pemenang Menunggu Klaim ({unclaimedWinners.length})
      </h2>

      {unclaimedWinners.length === 0 ? (
        <div className="p-6 rounded-2xl bg-[#E70013]/5 border border-[#E70013]/15 text-center text-xs text-[#E70013]/70 font-semibold">
          Tidak ada daftar pemenang yang belum diklaim.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {unclaimedWinners.map((res) => (
            <div
              key={res.id}
              className="bg-white border border-[#E70013]/20 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4 hover:border-[#E70013]/40 transition-all"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#E70013]/70">
                  Hadiah: {res.prize_name}
                </span>
                <p className="text-2xl font-black text-[#E70013] font-mono tracking-widest">
                  {res.voucher_code}
                </p>
                <p className="text-[10px] text-[#E70013]/60 font-semibold">
                  Waktu Undi: {new Date(res.drawn_at).toLocaleTimeString('id-ID')}
                </p>
              </div>

              <button
                onClick={() => onQuickClaim(res.voucher_code)}
                className="px-4 py-2 rounded-xl bg-[#E70013] hover:bg-[#E70013]/90 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer active:scale-95 border border-[#E70013]"
              >
                <CheckCircle2 className="w-4 h-4" />
                Proses Klaim
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

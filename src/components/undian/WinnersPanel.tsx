import React from 'react';
import { Voucher } from '@/types';
import { Trophy } from 'lucide-react';

interface WinnersPanelProps {
  winners: Voucher[];
}

export const WinnersPanel: React.FC<WinnersPanelProps> = ({ winners }) => {
  const sortedWinners = [...winners].sort(
    (a, b) => new Date(b.won_at ?? 0).getTime() - new Date(a.won_at ?? 0).getTime()
  );

  return (
    <div className="space-y-3">
      <label className="text-xs font-black uppercase tracking-wider text-[#E70013] flex items-center gap-1.5">
        <Trophy className="w-4 h-4 text-[#E70013]" />
        Daftar Pemenang ({winners.length}):
      </label>

      {sortedWinners.length === 0 ? (
        <div className="p-4 rounded-2xl bg-white border-2 border-dashed border-[#E70013]/30 text-center">
          <p className="text-xs font-bold text-[#E70013]/50">
            Belum ada pemenang. Undi hadiah untuk menambahkan di sini.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-64 sm:max-h-72 lg:max-h-[calc(100vh-7rem)] overflow-y-auto pr-1 pb-2">
          {sortedWinners.map((w) => (
            <div
              key={w.code}
              className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl border-2 border-slate-200 bg-white"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Trophy className="w-3.5 h-3.5 text-[#E70013] flex-shrink-0" />
                <span className="text-[11px] font-black truncate">{w.prize_name || '-'}</span>
              </span>
              <span className="text-sm font-black font-mono tracking-widest text-[#E70013] flex-shrink-0">
                {w.code}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

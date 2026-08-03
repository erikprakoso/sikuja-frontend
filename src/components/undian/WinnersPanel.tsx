import React, { useState } from 'react';
import { Voucher } from '@/types';
import { Trophy, ChevronDown } from 'lucide-react';

interface WinnersPanelProps {
  winners: Voucher[];
}

const PAGE_SIZE = 8;

export const WinnersPanel: React.FC<WinnersPanelProps> = ({ winners }) => {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const sortedWinners = [...winners].sort(
    (a, b) => new Date(b.won_at ?? 0).getTime() - new Date(a.won_at ?? 0).getTime()
  );

  const visibleWinners = sortedWinners.slice(0, visibleCount);
  const hasMore = visibleCount < sortedWinners.length;

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
        <div className="flex flex-col gap-1.5 max-h-[45vh] sm:max-h-[50vh] lg:max-h-[calc(100vh-8rem)] overflow-y-auto overscroll-contain pr-1 pb-2 [scrollbar-width:thin] [scrollbar-color:#E70013_transparent]">
          {visibleWinners.map((w) => (
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

          {hasMore && (
            <button
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              className="w-full flex items-center justify-center gap-1.5 mt-1 py-2 rounded-xl bg-[#E70013]/10 border border-[#E70013]/30 text-[#E70013] text-[11px] font-black hover:bg-[#E70013]/20 transition-colors cursor-pointer active:scale-95"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              Muat {Math.min(PAGE_SIZE, sortedWinners.length - visibleCount)} lagi ({sortedWinners.length - visibleCount} tersisa)
            </button>
          )}
        </div>
      )}
    </div>
  );
};

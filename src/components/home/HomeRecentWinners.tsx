import React, { useMemo } from 'react';
import { DrawResult } from '@/types';
import { Flame } from 'lucide-react';

interface HomeRecentWinnersProps {
  winners: DrawResult[];
  lastSyncedAt?: Date | null;
}

export const HomeRecentWinners: React.FC<HomeRecentWinnersProps> = ({ winners, lastSyncedAt }) => {
  const sortedWinners = useMemo(
    () =>
      [...winners].sort(
        (a, b) => new Date(b.drawn_at).getTime() - new Date(a.drawn_at).getTime()
      ),
    [winners]
  );

  if (winners.length === 0) return null;

  return (
    <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Flame className="w-5 h-5 text-[#E70013]" />
          Pengundian Terakhir
        </h2>
        <span className="text-xs text-slate-500 font-semibold">
          {lastSyncedAt
            ? `Pembaruan ${lastSyncedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
            : 'Pembaruan Otomatis'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedWinners.slice(0, 6).map((win) => (
          <div
            key={win.id}
            className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs hover:border-slate-300 transition-all"
          >
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                {win.prize_name}
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono tracking-widest mt-0.5">
                {win.voucher_code}
              </p>
            </div>
            <div>
              {win.claimed ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-800 text-white text-[10px] font-bold shadow-xs">
                  Hadiah Diserahkan
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-bold shadow-xs">
                  Menunggu Klaim
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

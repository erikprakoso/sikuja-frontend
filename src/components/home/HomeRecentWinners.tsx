import React from 'react';
import { DrawResult } from '@/types';
import { Flame } from 'lucide-react';

interface HomeRecentWinnersProps {
  winners: DrawResult[];
}

export const HomeRecentWinners: React.FC<HomeRecentWinnersProps> = ({ winners }) => {
  if (winners.length === 0) return null;

  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
          Pengundian Terakhir
        </h2>
        <span className="text-xs text-slate-400 font-semibold">
          Pembaruan Real-Time
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {winners.slice(0, 6).map((win) => (
          <div
            key={win.id}
            className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between shadow-md"
          >
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400">
                {win.prize_name}
              </span>
              <p className="text-2xl font-black text-white font-mono tracking-widest mt-0.5">
                {win.voucher_code}
              </p>
            </div>
            <div>
              {win.claimed ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] font-bold">
                  Hadiah Diserahkan
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-amber-950 border border-amber-700 text-amber-300 text-[10px] font-bold">
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

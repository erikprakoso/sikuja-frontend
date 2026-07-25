import React from 'react';
import { DrawResult } from '@/types';
import { Flame } from 'lucide-react';

interface HomeRecentWinnersProps {
  winners: DrawResult[];
}

export const HomeRecentWinners: React.FC<HomeRecentWinnersProps> = ({ winners }) => {
  if (winners.length === 0) return null;

  return (
    <section className="bg-white border-4 border-[#E70013] rounded-3xl p-6 sm:p-8 space-y-4 shadow-md">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-[#E70013] flex items-center gap-2">
          <Flame className="w-5 h-5 text-[#E70013] animate-bounce" />
          Pengundian Terakhir
        </h2>
        <span className="text-xs text-[#E70013] font-extrabold">
          Pembaruan Real-Time
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {winners.slice(0, 6).map((win) => (
          <div
            key={win.id}
            className="bg-white border-2 border-[#E70013] rounded-2xl p-4 flex items-center justify-between shadow-sm"
          >
            <div>
              <span className="text-[10px] uppercase tracking-wider font-black text-[#E70013]">
                {win.prize_name}
              </span>
              <p className="text-2xl font-black text-[#E70013] font-mono tracking-widest mt-0.5">
                {win.voucher_code}
              </p>
            </div>
            <div>
              {win.claimed ? (
                <span className="px-2.5 py-1 rounded-full bg-[#E70013] text-white text-[10px] font-black shadow">
                  Hadiah Diserahkan
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-white text-[#E70013] border-2 border-[#E70013] text-[10px] font-black shadow">
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

import React from 'react';
import { Voucher } from '@/types';
import { Ticket, CheckCircle, Trophy, Award } from 'lucide-react';

interface EVoucherCardListProps {
  vouchers: Voucher[];
}

export const EVoucherCardList: React.FC<EVoucherCardListProps> = ({ vouchers }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Ticket className="w-4 h-4 text-cyan-400" />
          Daftar Kupon Peserta ({vouchers.length})
        </h2>
        <span className="text-[11px] text-slate-500 font-medium">Kartu Kupon</span>
      </div>

      {/* Grid 2 Columns on Mobile, 3 Columns on Tablet/Desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {vouchers.map((v, idx) => {
          let cardBg = 'bg-slate-900/90 border-slate-800 hover:border-slate-700';
          let badgeBg = 'bg-slate-800 text-slate-400 border-slate-700';
          let statusText = 'Belum Terverifikasi';
          let StatusIcon = Ticket;
          let codeColor = 'text-cyan-300';

          if (v.status === 'checkin') {
            cardBg = 'bg-slate-900/90 border-emerald-800/80 ring-1 ring-emerald-500/30';
            badgeBg = 'bg-emerald-950 border-emerald-600 text-emerald-300';
            statusText = '✓ Terverifikasi';
            StatusIcon = CheckCircle;
            codeColor = 'text-emerald-400';
          } else if (v.status === 'menang') {
            cardBg = 'bg-gradient-to-b from-amber-950/90 to-slate-950 border-amber-400 ring-2 ring-amber-400/60 shadow-lg shadow-amber-950/50 animate-pulse';
            badgeBg = 'bg-amber-400 text-slate-950 border-amber-300 font-black';
            statusText = `🏆 ${v.prize_name || 'Pemenang'}`;
            StatusIcon = Trophy;
            codeColor = 'text-amber-300';
          } else if (v.status === 'diklaim') {
            cardBg = 'bg-slate-900/90 border-purple-800/80';
            badgeBg = 'bg-purple-950 border-purple-600 text-purple-300';
            statusText = '✓ Hadiah Diserahkan';
            StatusIcon = Award;
            codeColor = 'text-purple-300';
          }

          return (
            <div
              key={v.code}
              className={`p-4 rounded-2xl border ${cardBg} shadow-lg flex flex-col justify-between aspect-square text-center relative overflow-hidden transition-all hover:scale-[1.02]`}
            >
              {/* Top Row: Coupon Index & Icon */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded-lg border border-slate-800 text-[11px]">
                  #{idx + 1}
                </span>
                <StatusIcon className={`w-4 h-4 ${v.status === 'menang' ? 'text-amber-400' : 'text-slate-500'}`} />
              </div>

              {/* Middle Section: Prominent 5-Digit Voucher Code */}
              <div className="my-auto py-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
                  Kode Kupon
                </span>
                <div className={`text-2xl sm:text-3xl font-black font-mono tracking-wider ${codeColor}`}>
                  {v.code}
                </div>
              </div>

              {/* Bottom Row: Status Badge */}
              <div>
                <span className={`block w-full py-1 px-1.5 rounded-xl text-[10px] font-extrabold uppercase border truncate text-center ${badgeBg}`}>
                  {statusText}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

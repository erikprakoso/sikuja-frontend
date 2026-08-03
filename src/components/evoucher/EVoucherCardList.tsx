import React from 'react';
import { Voucher } from '@/types';
import { Ticket, CheckCircle, Trophy, Award, Ban } from 'lucide-react';

interface EVoucherCardListProps {
  vouchers: Voucher[];
}

export const EVoucherCardList: React.FC<EVoucherCardListProps> = ({ vouchers }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Ticket className="w-4 h-4 text-[#E70013]" />
          Daftar Kupon Peserta ({vouchers.length})
        </h2>
        <span className="text-[11px] text-slate-500 font-medium">Kartu Kupon</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {vouchers.map((v, idx) => {
          let cardBg = 'bg-white border border-slate-200';
          let badgeBg = 'bg-slate-100 text-slate-700 border border-slate-300';
          let statusText = 'Belum Terverifikasi';
          let StatusIcon = Ticket;
          let codeColor = 'text-slate-900';

          if (v.status === 'checkin') {
            cardBg = 'bg-emerald-900 border border-emerald-900 text-white';
            badgeBg = 'bg-white text-emerald-900';
            statusText = '✓ Terverifikasi';
            StatusIcon = CheckCircle;
            codeColor = 'text-white';
          } else if (v.status === 'menang') {
            cardBg = 'bg-[#E70013] border border-[#E70013] text-white shadow-md animate-pulse';
            badgeBg = 'bg-white text-[#E70013] font-bold';
            statusText = `🏆 ${v.prize_name || 'Pemenang'}`;
            StatusIcon = Trophy;
            codeColor = 'text-white';
          } else if (v.status === 'diklaim') {
            cardBg = 'bg-purple-900 border border-purple-900 text-white';
            badgeBg = 'bg-white text-purple-900';
            statusText = '✓ Hadiah Diserahkan';
            StatusIcon = Award;
            codeColor = 'text-white';
          } else if (v.status === 'forfeited') {
            cardBg = 'bg-red-900 border border-red-900 text-white';
            badgeBg = 'bg-white text-red-900';
            statusText = '✕ Kupon Gugur';
            StatusIcon = Ban;
            codeColor = 'text-white';
          }

          return (
            <div
              key={v.code}
              className={`p-4 rounded-2xl ${cardBg} shadow-xs flex flex-col justify-between aspect-square text-center relative overflow-hidden transition-all hover:scale-[1.02]`}
            >
              {/* Top Row: Coupon Index & Icon */}
              <div className="flex items-center justify-between text-xs font-bold">
                <span className={`font-mono px-2 py-0.5 rounded-md text-[11px] ${v.status === 'terbit' ? 'bg-slate-100 text-slate-800 border border-slate-200' : 'bg-white text-slate-900'}`}>
                  #{idx + 1}
                </span>
                <StatusIcon className={`w-4 h-4 ${v.status === 'terbit' ? 'text-slate-500' : 'text-white'}`} />
              </div>

              {/* Middle Section: Prominent 5-Digit Voucher Code */}
              <div className="my-auto py-1">
                <span className={`text-[10px] uppercase font-bold tracking-wider block mb-0.5 ${v.status === 'terbit' ? 'text-slate-400' : 'text-white/80'}`}>
                  Kode Kupon
                </span>
                <div className={`text-2xl sm:text-3xl font-black font-mono tracking-wider ${codeColor}`}>
                  {v.code}
                </div>
              </div>

              {/* Bottom Row: Status Badge */}
              <div>
                <span className={`block w-full py-1 px-1.5 rounded-xl text-[10px] font-bold uppercase border truncate text-center shadow-2xs ${badgeBg}`}>
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

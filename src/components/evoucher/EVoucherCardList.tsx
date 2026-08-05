import React from 'react';
import { Voucher } from '@/types';
import { Ticket, CheckCircle, Trophy, Award, Ban } from 'lucide-react';

interface EVoucherCardListProps {
  vouchers: Voucher[];
}

export const EVoucherCardList: React.FC<EVoucherCardListProps> = ({ vouchers }) => {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Ticket className="w-3.5 h-3.5 text-[#E70013]" />
          Daftar Kupon ({vouchers.length})
        </h2>
        <span className="text-[10px] text-slate-500 font-medium">Kartu Kupon</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {vouchers.map((v, idx) => {
          let cardBg = 'bg-white border border-slate-200';
          let badgeBg = 'bg-slate-100 text-slate-700 border border-slate-300';
          let statusText = 'Belum';
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
            statusText = '✓ Hadiah';
            StatusIcon = Award;
            codeColor = 'text-white';
          } else if (v.status === 'forfeited') {
            cardBg = 'bg-red-900 border border-red-900 text-white';
            badgeBg = 'bg-white text-red-900';
            statusText = '✕ Gugur';
            StatusIcon = Ban;
            codeColor = 'text-white';
          }

          return (
            <div
              key={v.code}
              className={`p-2 rounded-xl ${cardBg} shadow-xs flex flex-col justify-between aspect-square text-center relative overflow-hidden transition-all`}
            >
              {/* Top Row: Coupon Index & Icon */}
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className={`font-mono px-1.5 py-0.5 rounded-md text-[9px] ${v.status === 'terbit' ? 'bg-slate-100 text-slate-800 border border-slate-200' : 'bg-white text-slate-900'}`}>
                  #{idx + 1}
                </span>
                <StatusIcon className={`w-3.5 h-3.5 ${v.status === 'terbit' ? 'text-slate-500' : 'text-white'}`} />
              </div>

              {/* Middle Section: Prominent 5-Digit Voucher Code */}
              <div className="my-auto py-0.5">
                <span className={`text-[8px] uppercase font-bold tracking-wider block mb-0.5 ${v.status === 'terbit' ? 'text-slate-400' : 'text-white/80'}`}>
                  Kode Kupon
                </span>
                <div className={`text-lg sm:text-xl font-black font-mono tracking-wider ${codeColor}`}>
                  {v.code}
                </div>
              </div>

              {/* Bottom Row: Status Badge */}
              <div>
                <span className={`block w-full py-0.5 px-1 rounded-lg text-[8px] font-bold uppercase border truncate text-center shadow-2xs ${badgeBg}`}>
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

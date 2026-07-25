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
        <h2 className="text-xs font-black uppercase tracking-wider text-[#E70013] flex items-center gap-1.5">
          <Ticket className="w-4 h-4 text-[#E70013]" />
          Daftar Kupon Peserta ({vouchers.length})
        </h2>
        <span className="text-[11px] text-[#E70013] font-bold">Kartu Kupon</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {vouchers.map((v, idx) => {
          let cardBg = 'bg-white border-4 border-[#E70013]';
          let badgeBg = 'bg-white text-[#E70013] border-2 border-[#E70013]';
          let statusText = 'Belum Terverifikasi';
          let StatusIcon = Ticket;
          let codeColor = 'text-[#E70013]';

          if (v.status === 'checkin') {
            cardBg = 'bg-[#E70013] border-4 border-[#E70013] text-white';
            badgeBg = 'bg-white text-[#E70013]';
            statusText = '✓ Terverifikasi';
            StatusIcon = CheckCircle;
            codeColor = 'text-white';
          } else if (v.status === 'menang') {
            cardBg = 'bg-[#E70013] border-4 border-[#E70013] text-white shadow-xl animate-pulse';
            badgeBg = 'bg-white text-[#E70013] font-black';
            statusText = `🏆 ${v.prize_name || 'Pemenang'}`;
            StatusIcon = Trophy;
            codeColor = 'text-white';
          } else if (v.status === 'diklaim') {
            cardBg = 'bg-[#E70013] border-4 border-[#E70013] text-white';
            badgeBg = 'bg-white text-[#E70013]';
            statusText = '✓ Hadiah Diserahkan';
            StatusIcon = Award;
            codeColor = 'text-white';
          }

          return (
            <div
              key={v.code}
              className={`p-4 rounded-2xl ${cardBg} shadow-md flex flex-col justify-between aspect-square text-center relative overflow-hidden transition-all hover:scale-[1.02]`}
            >
              {/* Top Row: Coupon Index & Icon */}
              <div className="flex items-center justify-between text-xs font-black">
                <span className={`font-mono px-2 py-0.5 rounded-lg border text-[11px] ${v.status === 'terbit' ? 'bg-[#E70013] text-white border-[#E70013]' : 'bg-white text-[#E70013] border-white'}`}>
                  #{idx + 1}
                </span>
                <StatusIcon className={`w-4 h-4 ${v.status === 'terbit' ? 'text-[#E70013]' : 'text-white'}`} />
              </div>

              {/* Middle Section: Prominent 5-Digit Voucher Code */}
              <div className="my-auto py-1">
                <span className={`text-[10px] uppercase font-black tracking-wider block mb-0.5 ${v.status === 'terbit' ? 'text-[#E70013]' : 'text-white'}`}>
                  Kode Kupon
                </span>
                <div className={`text-2xl sm:text-3xl font-black font-mono tracking-wider ${codeColor}`}>
                  {v.code}
                </div>
              </div>

              {/* Bottom Row: Status Badge */}
              <div>
                <span className={`block w-full py-1 px-1.5 rounded-xl text-[10px] font-black uppercase border truncate text-center shadow-sm ${badgeBg}`}>
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

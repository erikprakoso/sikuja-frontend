import React from 'react';
import { Voucher } from '@/types';

interface EVoucherCardListProps {
  vouchers: Voucher[];
}

export const EVoucherCardList: React.FC<EVoucherCardListProps> = ({ vouchers }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">
        Daftar Kode Voucher Anda ({vouchers.length})
      </h2>

      {vouchers.map((v, idx) => {
        let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
        let statusText = 'Belum Check-In Pos';

        if (v.status === 'checkin') {
          badgeColor = 'bg-emerald-950 border-emerald-700 text-emerald-300';
          statusText = '✓ Sah Ikut Undian';
        } else if (v.status === 'menang') {
          badgeColor = 'bg-amber-950 border-amber-600 text-amber-300 animate-pulse';
          statusText = `🏆 MENANG: ${v.prize_name || 'Hadiah'}`;
        } else if (v.status === 'diklaim') {
          badgeColor = 'bg-purple-950 border-purple-700 text-purple-300';
          statusText = '✓ Hadiah Sudah Diklaim';
        }

        return (
          <div
            key={v.code}
            className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center justify-between gap-4"
          >
            <div className="space-y-2 text-left flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 font-mono">#Kupon {idx + 1}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${badgeColor}`}>
                  {statusText}
                </span>
              </div>

              <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-widest bg-slate-950 py-2 px-4 rounded-2xl border border-slate-800 inline-block">
                {v.code}
              </div>

              <p className="text-[11px] text-slate-400">
                Tipe: <span className="font-semibold text-slate-200 capitalize">{v.type}</span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

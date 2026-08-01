import React from 'react';
import { DrawResult } from '@/types';

interface AdminStatCardsProps {
  totalSales: number;
  totalFisik: number;
  totalNonFisik: number;
  totalCheckin: number;
  drawResults: DrawResult[];
}

export const AdminStatCards: React.FC<AdminStatCardsProps> = ({
  totalSales,
  totalFisik,
  totalNonFisik,
  totalCheckin,
  drawResults,
}) => {
  const participationRate = totalSales > 0 ? ((totalCheckin / totalSales) * 100).toFixed(0) : '0';
  const totalClaimed = drawResults.filter((r) => r.claimed).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Penerbitan</span>
        <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5">{totalSales} <span className="text-sm font-semibold text-slate-500">Lembar</span></p>
        <span className="text-[11px] font-semibold text-slate-500 block mt-1">
          {totalFisik} Fisik • {totalNonFisik} E-Voucher
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kehadiran Peserta</span>
        <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5">{totalCheckin} <span className="text-sm font-semibold text-slate-500">Kupon</span></p>
        <span className="text-[11px] font-semibold text-slate-500 block mt-1">Kehadiran {participationRate}%</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kupon Terundi</span>
        <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5">{drawResults.length} <span className="text-sm font-semibold text-slate-500">Kupon</span></p>
        <span className="text-[11px] font-semibold text-slate-500 block mt-1">{totalClaimed} Hadiah Diserahkan</span>
      </div>
    </div>
  );
};

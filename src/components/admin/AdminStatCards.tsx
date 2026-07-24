import React from 'react';
import { DrawResult } from '@/types';

interface AdminStatCardsProps {
  totalSales: number;
  totalFisik: number;
  totalNonFisik: number;
  totalCheckin: number;
  drawResults: DrawResult[];
  totalDana: number;
}

export const AdminStatCards: React.FC<AdminStatCardsProps> = ({
  totalSales,
  totalFisik,
  totalNonFisik,
  totalCheckin,
  drawResults,
  totalDana,
}) => {
  const participationRate = totalSales > 0 ? ((totalCheckin / totalSales) * 100).toFixed(0) : '0';
  const totalClaimed = drawResults.filter((r) => r.claimed).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <span className="text-xs font-bold text-slate-400 uppercase">Total Penerbitan</span>
        <p className="text-2xl font-black text-white mt-1">{totalSales} Lembar</p>
        <span className="text-[11px] text-slate-500 block mt-1">
          {totalFisik} Kupon Fisik • {totalNonFisik} E-Voucher
        </span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <span className="text-xs font-bold text-slate-400 uppercase">Kehadiran Peserta</span>
        <p className="text-2xl font-black text-emerald-400 mt-1">{totalCheckin} Kupon</p>
        <span className="text-[11px] text-slate-500 block mt-1">Tingkat Kehadiran {participationRate}%</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <span className="text-xs font-bold text-slate-400 uppercase">Kupon Terundi</span>
        <p className="text-2xl font-black text-amber-400 mt-1">{drawResults.length} Kupon</p>
        <span className="text-[11px] text-slate-500 block mt-1">{totalClaimed} Hadiah Diserahkan</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <span className="text-xs font-bold text-slate-400 uppercase">Total Pendapatan Kas</span>
        <p className="text-2xl font-black text-cyan-400 mt-1">
          Rp {totalDana.toLocaleString('id-ID')}
        </p>
        <span className="text-[11px] text-slate-500 block mt-1">Pendapatan Terverifikasi</span>
      </div>
    </div>
  );
};

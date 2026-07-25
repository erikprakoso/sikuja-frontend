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
      <div className="bg-white border border-[#E70013]/20 rounded-2xl p-4 sm:p-5 shadow-xs">
        <span className="text-xs font-bold text-[#E70013]/70 uppercase tracking-wider">Total Penerbitan</span>
        <p className="text-2xl sm:text-3xl font-black text-[#E70013] mt-1.5">{totalSales} <span className="text-sm font-semibold">Lembar</span></p>
        <span className="text-[11px] font-semibold text-[#E70013]/60 block mt-1">
          {totalFisik} Fisik • {totalNonFisik} E-Voucher
        </span>
      </div>

      <div className="bg-white border border-[#E70013]/20 rounded-2xl p-4 sm:p-5 shadow-xs">
        <span className="text-xs font-bold text-[#E70013]/70 uppercase tracking-wider">Kehadiran Peserta</span>
        <p className="text-2xl sm:text-3xl font-black text-[#E70013] mt-1.5">{totalCheckin} <span className="text-sm font-semibold">Kupon</span></p>
        <span className="text-[11px] font-semibold text-[#E70013]/60 block mt-1">Kehadiran {participationRate}%</span>
      </div>

      <div className="bg-white border border-[#E70013]/20 rounded-2xl p-4 sm:p-5 shadow-xs">
        <span className="text-xs font-bold text-[#E70013]/70 uppercase tracking-wider">Kupon Terundi</span>
        <p className="text-2xl sm:text-3xl font-black text-[#E70013] mt-1.5">{drawResults.length} <span className="text-sm font-semibold">Kupon</span></p>
        <span className="text-[11px] font-semibold text-[#E70013]/60 block mt-1">{totalClaimed} Hadiah Diserahkan</span>
      </div>

      <div className="bg-[#E70013] text-white border border-[#E70013] rounded-2xl p-4 sm:p-5 shadow-sm">
        <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Total Pendapatan Kas</span>
        <p className="text-2xl sm:text-3xl font-black text-white font-mono mt-1.5">
          Rp {totalDana.toLocaleString('id-ID')}
        </p>
        <span className="text-[11px] font-semibold text-white/80 block mt-1">Pendapatan Terverifikasi</span>
      </div>
    </div>
  );
};

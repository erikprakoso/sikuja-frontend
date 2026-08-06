import React from 'react';
import { DrawResult } from '@/types';
import { Ticket, Banknote, QrCode, Trophy, Receipt } from 'lucide-react';

interface AdminStatCardsProps {
  totalSales: number;
  totalFisik: number;
  totalNonFisik: number;
  totalCheckin: number;
  drawResults: DrawResult[];
  totalOmzet: number;
  totalTransactions: number;
}

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
};

export const AdminStatCards: React.FC<AdminStatCardsProps> = ({
  totalSales,
  totalFisik,
  totalNonFisik,
  totalCheckin,
  drawResults,
  totalOmzet,
  totalTransactions,
}) => {
  const participationRate = totalSales > 0 ? ((totalCheckin / totalSales) * 100).toFixed(0) : '0';
  const totalClaimed = drawResults.filter((r) => r.claimed).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
      {/* 1. Total Transaksi */}
      <div className="bg-sky-50/50 border border-sky-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Total Transaksi</span>
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-sky-600 text-white">
            <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <p className="text-xl sm:text-3xl font-black text-slate-900 mt-1 sm:mt-1.5">
          {totalTransactions} <span className="text-sm font-semibold text-slate-500">Transaksi</span>
        </p>
        <span className="hidden sm:block text-[11px] font-semibold text-slate-500 mt-1">Seluruh transaksi penjualan</span>
      </div>

      {/* 2. Total Penerbitan */}
      <div className="bg-[#E70013]/5 border border-[#E70013]/20 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Total Penerbitan</span>
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-[#E70013] text-white">
            <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <p className="text-xl sm:text-3xl font-black text-slate-900 mt-1 sm:mt-1.5">
          {totalSales} <span className="text-sm font-semibold text-slate-500">Lembar</span>
        </p>
        <span className="hidden sm:block text-[11px] font-semibold text-slate-500 mt-1">
          {totalFisik} Fisik • {totalNonFisik} E-Voucher
        </span>
      </div>

      {/* 3. Hasil Penjualan */}
      <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Hasil Penjualan</span>
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-emerald-600 text-white">
            <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <p className="text-lg sm:text-3xl font-black text-emerald-700 mt-1 sm:mt-1.5">
          {formatRupiah(totalOmzet)}
        </p>
        <span className="hidden sm:block text-[11px] font-semibold text-slate-500 mt-1">
          Omzet riil dari {totalSales} kupon terjual
        </span>
      </div>

      {/* 4. Kehadiran Peserta */}
      <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Kehadiran Peserta</span>
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-900 text-white">
            <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <p className="text-xl sm:text-3xl font-black text-slate-900 mt-1 sm:mt-1.5">
          {totalCheckin} <span className="text-sm font-semibold text-slate-500">Kupon</span>
        </p>
        <span className="hidden sm:block text-[11px] font-semibold text-slate-500 mt-1">Kehadiran {participationRate}%</span>
      </div>

      {/* 5. Kupon Terundi */}
      <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Kupon Terundi</span>
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-[#E70013] text-white">
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <p className="text-xl sm:text-3xl font-black text-slate-900 mt-1 sm:mt-1.5">
          {drawResults.length} <span className="text-sm font-semibold text-slate-500">Kupon</span>
        </p>
        <span className="hidden sm:block text-[11px] font-semibold text-slate-500 mt-1">{totalClaimed} Hadiah Diserahkan</span>
      </div>
    </div>
  );
};

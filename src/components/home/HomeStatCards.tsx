import React from 'react';
import { Ticket, QrCode, Trophy } from 'lucide-react';

interface HomeStatCardsProps {
  totalTerjual: number;
  totalFisik: number;
  totalNonFisik: number;
  totalCheckin: number;
  winnersCount: number;
  claimedCount: number;
}

export const HomeStatCards: React.FC<HomeStatCardsProps> = ({
  totalTerjual,
  totalFisik,
  totalNonFisik,
  totalCheckin,
  winnersCount,
  claimedCount,
}) => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Penerbitan</span>
          <Ticket className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
        </div>
        <p className="text-3xl font-black text-white mt-2">
          {totalTerjual} <span className="text-xs font-normal text-slate-400">Lembar</span>
        </p>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
          <span className="text-red-400 font-semibold">{totalFisik} Kupon Fisik</span> • 
          <span className="text-cyan-400 font-semibold">{totalNonFisik} E-Voucher</span>
        </div>
      </div>

      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kehadiran Peserta</span>
          <QrCode className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
        </div>
        <p className="text-3xl font-black text-emerald-400 mt-2">
          {totalCheckin} <span className="text-xs font-normal text-slate-400">Kupon</span>
        </p>
        <p className="mt-2 text-[11px] text-slate-400 font-medium">
          Terverifikasi masuk ke sistem undian
        </p>
      </div>

      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kupon Terundi</span>
          <Trophy className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
        </div>
        <p className="text-3xl font-black text-amber-400 mt-2">
          {winnersCount} <span className="text-xs font-normal text-slate-400">Kupon</span>
        </p>
        <p className="mt-2 text-[11px] text-slate-400 font-medium">
          {claimedCount} Hadiah telah diserahkan
        </p>
      </div>
    </section>
  );
};

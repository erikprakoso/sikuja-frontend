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
      {/* 1. Total Penerbitan */}
      <div className="bg-white border border-[#E70013]/20 rounded-2xl p-5 shadow-xs relative overflow-hidden group transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#E70013]/70 uppercase tracking-wider">Total Penerbitan</span>
          <div className="p-2 rounded-xl bg-[#E70013] text-white group-hover:scale-105 transition-transform">
            <Ticket className="w-4 h-4" />
          </div>
        </div>
        <p className="text-3xl font-black text-[#E70013] mt-2">
          {totalTerjual} <span className="text-xs font-semibold text-[#E70013]/70">Lembar</span>
        </p>
        <div className="mt-2 text-[11px] text-[#E70013] flex items-center gap-1.5 font-semibold">
          <span className="bg-[#E70013] text-white px-2 py-0.5 rounded-md font-bold">{totalFisik} Kupon Fisik</span> • 
          <span className="border border-[#E70013]/30 px-2 py-0.5 rounded-md">{totalNonFisik} E-Voucher</span>
        </div>
      </div>

      {/* 2. Kehadiran Peserta */}
      <div className="bg-white border border-[#E70013]/20 rounded-2xl p-5 shadow-xs relative overflow-hidden group transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#E70013]/70 uppercase tracking-wider">Kehadiran Peserta</span>
          <div className="p-2 rounded-xl bg-[#E70013] text-white group-hover:scale-105 transition-transform">
            <QrCode className="w-4 h-4" />
          </div>
        </div>
        <p className="text-3xl font-black text-[#E70013] mt-2">
          {totalCheckin} <span className="text-xs font-semibold text-[#E70013]/70">Kupon</span>
        </p>
        <p className="mt-2 text-[11px] text-[#E70013]/70 font-semibold">
          Terverifikasi masuk ke sistem undian
        </p>
      </div>

      {/* 3. Kupon Terundi */}
      <div className="bg-white border border-[#E70013]/20 rounded-2xl p-5 shadow-xs relative overflow-hidden group transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#E70013]/70 uppercase tracking-wider">Kupon Terundi</span>
          <div className="p-2 rounded-xl bg-[#E70013] text-white group-hover:scale-105 transition-transform">
            <Trophy className="w-4 h-4" />
          </div>
        </div>
        <p className="text-3xl font-black text-[#E70013] mt-2">
          {winnersCount} <span className="text-xs font-semibold text-[#E70013]/70">Kupon</span>
        </p>
        <p className="mt-2 text-[11px] text-[#E70013]/70 font-semibold">
          {claimedCount} Hadiah telah diserahkan
        </p>
      </div>
    </section>
  );
};

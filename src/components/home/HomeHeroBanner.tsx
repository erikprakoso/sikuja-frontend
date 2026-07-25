import React from 'react';
import Link from 'next/link';
import { Sparkles, Search, ArrowRight } from 'lucide-react';

interface HomeHeroBannerProps {
  searchToken: string;
  setSearchToken: (token: string) => void;
}

export const HomeHeroBanner: React.FC<HomeHeroBannerProps> = ({
  searchToken,
  setSearchToken,
}) => {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#E70013] border-4 border-[#E70013] p-8 sm:p-12 shadow-xl text-white">
      <div className="relative z-10 max-w-3xl space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-[#E70013] text-xs font-black uppercase tracking-widest shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-[#E70013] animate-pulse" />
          SIKUJA 2026 🇮🇩
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Sistem Kupon & Pengundian{' '}
          <span className="bg-white text-[#E70013] px-3 py-0.5 rounded-2xl inline-block mt-1">
            Jalan Sehat
          </span>
        </h1>

        <p className="text-white text-base sm:text-lg leading-relaxed font-medium">
          Platform manajemen voucher dan pengundian digital yang terintegrasi untuk kupon fisik dan e-voucher digital, 
          dilengkapi pemindaian pos dan tampilan panggung real-time.
        </p>

        {/* Participant E-Voucher Lookup */}
        <div className="pt-2">
          <label className="block text-xs font-black uppercase tracking-wider text-white mb-2">
            Cari E-Voucher Peserta (Masukkan Kode Token Transaksi)
          </label>
          <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Masukkan kode token transaksi..."
                value={searchToken}
                onChange={(e) => setSearchToken(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-white rounded-xl text-[#E70013] placeholder-[#E70013]/60 focus:outline-none text-sm font-mono font-bold shadow-inner"
              />
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#E70013]" />
            </div>
            <Link
              href={searchToken.trim() ? `/v/${searchToken.trim()}` : '#'}
              className={`px-6 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all ${
                searchToken.trim()
                  ? 'bg-white text-[#E70013] hover:bg-white/90 shadow-lg cursor-pointer active:scale-95'
                  : 'bg-white/20 text-white/50 pointer-events-none cursor-not-allowed border-2 border-white/30'
              }`}
            >
              Buka E-Voucher
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

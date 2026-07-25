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
    <section className="relative overflow-hidden rounded-3xl bg-[#E70013] border border-[#E70013] p-8 sm:p-12 shadow-lg text-white">
      <div className="relative z-10 max-w-3xl space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white text-[#E70013] text-xs font-bold uppercase tracking-wider shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#E70013]" />
          SIKUJA 2026 🇮🇩
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Sistem Kupon & Pengundian{' '}
          <span className="bg-white text-[#E70013] px-3.5 py-0.5 rounded-2xl inline-block mt-1">
            Jalan Sehat
          </span>
        </h1>

        <p className="text-white/90 text-base sm:text-lg leading-relaxed font-medium">
          Platform manajemen voucher dan pengundian digital yang terintegrasi untuk kupon fisik dan e-voucher digital, 
          dilengkapi pemindaian pos dan tampilan panggung real-time.
        </p>

        {/* Participant E-Voucher Lookup */}
        <div className="pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-white/90 mb-2">
            Cari E-Voucher Peserta (Masukkan Kode Token Transaksi)
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5 max-w-xl">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Masukkan kode token transaksi..."
                value={searchToken}
                onChange={(e) => setSearchToken(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-white rounded-xl text-[#E70013] placeholder-[#E70013]/50 focus:outline-none text-sm font-mono font-bold shadow-xs"
              />
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#E70013]/70" />
            </div>
            <Link
              href={searchToken.trim() ? `/v/${searchToken.trim()}` : '#'}
              className={`px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                searchToken.trim()
                  ? 'bg-white text-[#E70013] hover:bg-white/95 shadow-md cursor-pointer active:scale-95'
                  : 'bg-white/20 text-white/50 pointer-events-none cursor-not-allowed border border-white/30'
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

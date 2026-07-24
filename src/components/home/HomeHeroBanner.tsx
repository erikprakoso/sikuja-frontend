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
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-950 via-slate-900 to-red-900 border border-red-800/40 p-8 sm:p-12 shadow-2xl">
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 max-w-3xl space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          SIKUJA 2026 🇮🇩
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Sistem Kupon & Pengundian{' '}
          <span className="bg-gradient-to-r from-red-400 via-amber-200 to-white bg-clip-text text-transparent">
            Jalan Sehat
          </span>
        </h1>

        <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-normal">
          Platform manajemen voucher dan pengundian digital yang terintegrasi untuk kupon fisik dan e-voucher digital, 
          dilengkapi pemindaian pos dan tampilan panggung real-time.
        </p>

        {/* Participant E-Voucher Lookup */}
        <div className="pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Cari E-Voucher Peserta (Masukkan Kode Token Transaksi)
          </label>
          <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Masukkan kode token transaksi..."
                value={searchToken}
                onChange={(e) => setSearchToken(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm font-mono"
              />
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            </div>
            <Link
              href={searchToken.trim() ? `/v/${searchToken.trim()}` : '#'}
              className={`px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                searchToken.trim()
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/50 cursor-pointer active:scale-95'
                  : 'bg-slate-800 text-slate-500 pointer-events-none cursor-not-allowed'
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

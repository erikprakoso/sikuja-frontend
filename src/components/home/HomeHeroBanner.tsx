'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Search, Smartphone, Loader2 } from 'lucide-react';

export const HomeHeroBanner: React.FC = () => {
  const router = useRouter();
  const [searchToken, setSearchToken] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [savedToken] = useState<string | null>(
    () => (typeof window !== 'undefined' ? localStorage.getItem('sikuja_last_token') : null)
  );

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchToken.trim();
    if (!query || isSearching) return;

    setIsSearching(true);
    setSearchError('');
    try {
      const res = await fetch(`/api/vouchers/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (res.ok && data.success && data.token) {
        router.push(`/v/${data.token}`);
        return;
      }
      setSearchError(data.error || 'E-Voucher tidak ditemukan.');
    } catch {
      setSearchError('Gagal terhubung ke server. Periksa koneksi internet.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#E70013] border border-[#E70013] p-5 sm:p-8 shadow-lg text-white">
      <div className="relative z-10 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[#E70013] text-[11px] font-bold uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3 h-3 text-[#E70013]" />
            Jalan Sehat 2026 🇮🇩
          </div>

          {savedToken && (
            <Link
              href={`/v/${savedToken}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold hover:bg-black transition-all shadow-xs"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Buka Kupon Saya di HP Ini</span>
            </Link>
          )}
        </div>

        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
          Sistem Kupon & Pengundian{' '}
          <span className="bg-white text-[#E70013] px-2.5 py-0.5 rounded-xl inline-block mt-1">
            Jalan Sehat
          </span>
        </h1>

        <p className="hidden sm:block text-white/90 text-sm leading-relaxed font-medium max-w-2xl">
          Platform manajemen voucher dan pengundian digital untuk kupon fisik dan e-voucher,
          dengan pemindaian pos dan tampilan panggung real-time.
        </p>

        {/* Participant E-Voucher Lookup Form */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 max-w-xl">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cari E-Voucher (No. HP / Nama / Kode / Token)"
              value={searchToken}
              onChange={(e) => {
                setSearchToken(e.target.value);
                setSearchError('');
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-white rounded-xl text-[#171717] placeholder-slate-400 focus:outline-none text-sm font-bold shadow-xs"
            />
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          </div>
          <button
            type="submit"
            disabled={!searchToken.trim() || isSearching}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              searchToken.trim() && !isSearching
                ? 'bg-slate-900 text-white hover:bg-black shadow-md cursor-pointer active:scale-95'
                : 'bg-white/20 text-white/50 pointer-events-none cursor-not-allowed border border-white/30'
            }`}
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mencari...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Cari
              </>
            )}
          </button>
        </form>
        {searchError && (
          <p className="text-xs font-bold text-white bg-white/20 border border-white/30 rounded-lg px-3 py-2 max-w-xl animate-fade-in">
            {searchError}
          </p>
        )}
      </div>
    </section>
  );
};

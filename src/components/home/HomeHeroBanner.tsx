'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getStoredVouchers, getStoredTransactions } from '@/lib/storage';
import { Sparkles, Search, ArrowRight, Smartphone } from 'lucide-react';

export const HomeHeroBanner: React.FC = () => {
  const router = useRouter();
  const [searchToken, setSearchToken] = useState('');
  const [savedToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sikuja_last_token');
    }
    return null;
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchToken.trim();
    if (!query) return;

    const allTxs = getStoredTransactions();
    const allVouchers = getStoredVouchers();

    // 1. Search by No. HP / WhatsApp
    const phoneClean = query.replace(/\D/g, '');
    if (phoneClean.length >= 4) {
      const txByPhone = allTxs.find(
        (t) => t.customer_phone && t.customer_phone.replace(/\D/g, '').includes(phoneClean)
      );
      if (txByPhone) {
        router.push(`/v/${txByPhone.token}`);
        return;
      }
    }

    // 2. Search by Nama Pemilik
    const queryLower = query.toLowerCase();
    const txByName = allTxs.find(
      (t) => t.customer_name && t.customer_name.toLowerCase().includes(queryLower)
    );
    if (txByName) {
      router.push(`/v/${txByName.token}`);
      return;
    }

    // 3. Search by 5-Digit Voucher Code
    const formattedQuery = query.padStart(5, '0');
    const matchedVoucher = allVouchers.find((v) => v.code === query || v.code === formattedQuery);

    if (matchedVoucher) {
      const matchedTx = allTxs.find((t) => t.id === matchedVoucher.transaction_id);
      if (matchedTx) {
        router.push(`/v/${matchedTx.token}`);
        return;
      }
    }

    // 4. Default: Treat as Token
    router.push(`/v/${query}`);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#E70013] border border-[#E70013] p-8 sm:p-12 shadow-lg text-white">
      <div className="relative z-10 max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white text-[#E70013] text-xs font-bold uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#E70013]" />
            Jalan Sehat 2026 🇮🇩
          </div>

          {savedToken && (
            <Link
              href={`/v/${savedToken}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-black transition-all shadow-xs"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>📱 Buka Kupon Saya di HP Ini</span>
            </Link>
          )}
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

        {/* Participant E-Voucher Lookup Form */}
        <div className="pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-white/90 mb-2">
            Cari E-Voucher Peserta (Ketik No. HP / Nama Pemilik / Kode Kupon / Token):
          </label>
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5 max-w-xl">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Ketik No. HP / Nama Pembeli / 5-digit Kode / Token..."
                value={searchToken}
                onChange={(e) => setSearchToken(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-white rounded-xl text-[#171717] placeholder-slate-400 focus:outline-none text-sm font-bold shadow-xs"
              />
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            </div>
            <button
              type="submit"
              disabled={!searchToken.trim()}
              className={`px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                searchToken.trim()
                  ? 'bg-slate-900 text-white hover:bg-black shadow-md cursor-pointer active:scale-95'
                  : 'bg-white/20 text-white/50 pointer-events-none cursor-not-allowed border border-white/30'
              }`}
            >
              Cari E-Voucher
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

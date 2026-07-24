'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getStoredVouchers, getStoredTransactions, getStoredDrawResults, syncFromSupabase, SIVOJA_EVENT_NAME } from '@/lib/storage';
import { getCurrentSession } from '@/lib/services/auth';
import { Voucher, Transaction, DrawResult, UserSession } from '@/types';
import {
  Ticket,
  QrCode,
  Trophy,
  CheckCircle2,
  ShieldCheck,
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Users,
  Flame,
} from 'lucide-react';

const MODULE_CARDS = [
  {
    href: '/penjualan',
    title: '1. Penjualan Voucher',
    desc: 'Input beli voucher fisik & e-voucher. Cetak struk thermal & generate 1 QR per transaksi.',
    roles: ['penjual', 'admin'],
    pinText: 'Akses Penjual',
    icon: Ticket,
    borderColor: 'hover:border-red-600/60',
    shadowColor: 'hover:shadow-red-950/40',
    iconBg: 'bg-red-950 border-red-800/80 text-red-400',
    textColor: 'text-red-400',
  },
  {
    href: '/checkin',
    title: '2. Pos Check-In',
    desc: 'Scan QR voucher di pos rute. Batch Check-in 1-Click & Offline Queue otomatis.',
    roles: ['pos', 'admin'],
    pinText: 'Akses Pos',
    icon: QrCode,
    borderColor: 'hover:border-emerald-600/60',
    shadowColor: 'hover:shadow-emerald-950/40',
    iconBg: 'bg-emerald-950 border-emerald-800/80 text-emerald-400',
    textColor: 'text-emerald-400',
  },
  {
    href: '/undian',
    title: '3. Layar Undian',
    desc: 'Tampilan proyektor besar acak 5-digit, drumroll, CSPRNG & pengundian 2 tahap sah.',
    roles: ['mc', 'admin'],
    pinText: 'Akses MC/Operator',
    icon: Trophy,
    borderColor: 'hover:border-amber-500/60',
    shadowColor: 'hover:shadow-amber-950/40',
    iconBg: 'bg-amber-950 border-amber-800/80 text-amber-400',
    textColor: 'text-amber-400',
  },
  {
    href: '/verifikasi',
    title: '4. Verifikasi & Klaim',
    desc: 'Verifikasi panggung pemenang undian, klaim hadiah sah, Sobek Digital kupon.',
    roles: ['verifikator', 'admin'],
    pinText: 'Akses Verifikator',
    icon: CheckCircle2,
    borderColor: 'hover:border-cyan-500/60',
    shadowColor: 'hover:shadow-cyan-950/40',
    iconBg: 'bg-cyan-950 border-cyan-800/80 text-cyan-400',
    textColor: 'text-cyan-400',
  },
  {
    href: '/admin',
    title: '5. Admin & Pengaturan',
    desc: 'Manajemen stok hadiah, rekapitulasi data penjualan, export & sinkronisasi Supabase.',
    roles: ['admin'],
    pinText: 'Akses Admin Utama',
    icon: ShieldCheck,
    borderColor: 'hover:border-purple-500/60',
    shadowColor: 'hover:shadow-purple-950/40',
    iconBg: 'bg-purple-950 border-purple-800/80 text-purple-400',
    textColor: 'text-purple-400',
  },
];

export default function HomePage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [winners, setWinners] = useState<DrawResult[]>([]);
  const [session, setSession] = useState<UserSession | null>(null);
  const [searchToken, setSearchToken] = useState('');

  const loadData = () => {
    setSession(getCurrentSession());
    setVouchers(getStoredVouchers());
    setTransactions(getStoredTransactions());
    setWinners(getStoredDrawResults());
  };

  useEffect(() => {
    syncFromSupabase().then(() => {
      loadData();
    });
    if (typeof window !== 'undefined') {
      window.addEventListener(SIVOJA_EVENT_NAME, loadData);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(SIVOJA_EVENT_NAME, loadData);
      }
    };
  }, []);

  const totalTerjual = vouchers.length;
  const totalFisik = vouchers.filter((v) => v.type === 'fisik').length;
  const totalNonFisik = vouchers.filter((v) => v.type === 'non-fisik').length;
  const totalCheckin = vouchers.filter((v) => v.status === 'checkin' || v.status === 'menang' || v.status === 'diklaim').length;
  const totalDana = transactions.reduce((acc, t) => acc + t.total_harga, 0);

  const visibleCards = session
    ? MODULE_CARDS.filter((card) => card.roles.includes(session.role))
    : [];

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-950 via-slate-900 to-red-900 border border-red-800/40 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            Jalan Sehat Agustusan 2026 🇮🇩
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Sistem Undian Digital{' '}
            <span className="bg-gradient-to-r from-red-400 via-amber-200 to-white bg-clip-text text-transparent">
              Transparan & Bebas Kecurangan
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-normal">
            Pengganti kupon kertas manual. Mengintegrasikan voucher fisik & e-voucher digital dalam 
            <strong className="text-white font-semibold"> 1 pool kode acak 5-digit</strong>, 
            multi-scanner di pos check-in, dan layar undian real-time dengan efek suara.
          </p>

          {/* Quick Participant Search Bar */}
          <div className="pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              🔍 Buka E-Voucher Saya (Masukkan Token / Link Transaksi)
            </label>
            <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Contoh: tx_demo_seed_001 atau tempel token..."
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
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/50'
                    : 'bg-slate-800 text-slate-500 pointer-events-none'
                }`}
              >
                Lihat Voucher
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stat Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Terjual</span>
            <Ticket className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-white mt-2">{totalTerjual} <span className="text-xs font-normal text-slate-400">lembar</span></p>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
            <span className="text-red-400 font-semibold">{totalFisik} Fisik</span> • 
            <span className="text-cyan-400 font-semibold">{totalNonFisik} E-Voucher</span>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sudah Check-In Pos</span>
            <QrCode className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-emerald-400 mt-2">{totalCheckin} <span className="text-xs font-normal text-slate-400">voucher</span></p>
          <p className="mt-2 text-[11px] text-slate-400 font-medium">
            Eligible ikut pengocokan undian
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pemenang Ditarik</span>
            <Trophy className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-amber-400 mt-2">{winners.length} <span className="text-xs font-normal text-slate-400">kode</span></p>
          <p className="mt-2 text-[11px] text-slate-400 font-medium">
            {winners.filter(w => w.claimed).length} sudah diklaim di panggung
          </p>
        </div>
      </section>

      {/* Operasional Panitia Section (ONLY rendered when panitia is logged in) */}
      {session && visibleCards.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-red-500" />
              Modul Operasional ({session.name})
            </h2>
            <span className="text-xs text-slate-400">Akses Aktif: {session.role.toUpperCase()}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {visibleCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className={`group relative bg-slate-900/80 border border-slate-800 ${card.borderColor} rounded-2xl p-5 transition-all hover:shadow-xl ${card.shadowColor} flex flex-col justify-between`}
                >
                  <div className="space-y-3">
                    <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                  <div className={`mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold ${card.textColor}`}>
                    <span>{card.pinText}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Live Winner Announcements */}
      {winners.length > 0 && (
        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
              Daftar Pemenang Undian Terakhir
            </h2>
            <span className="text-xs text-slate-400 font-semibold">
              Live Real-Time
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {winners.slice(0, 6).map((win) => (
              <div
                key={win.id}
                className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between shadow-md"
              >
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400">
                    {win.prize_name}
                  </span>
                  <p className="text-2xl font-black text-white font-mono tracking-widest mt-0.5">
                    {win.voucher_code}
                  </p>
                </div>
                <div>
                  {win.claimed ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] font-bold">
                      ✓ Sudah Diklaim
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-amber-950 border border-amber-700 text-amber-300 text-[10px] font-bold">
                      Menunggu Klaim
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

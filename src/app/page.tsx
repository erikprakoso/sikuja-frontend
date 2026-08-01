'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getStoredVouchers, getStoredDrawResults, syncFromSupabase, SIKUJA_EVENT_NAME } from '@/lib/storage';
import { getCurrentSession, refreshSession } from '@/lib/services/auth';
import { Voucher, DrawResult, UserSession } from '@/types';
import { WifiOff, RefreshCw, CheckCircle2, Lock, ArrowRight } from 'lucide-react';

import { HomeHeroBanner } from '@/components/home/HomeHeroBanner';
import { HomeBuyCoupons } from '@/components/home/HomeBuyCoupons';
import { HomeStatCards } from '@/components/home/HomeStatCards';
import { HomeModuleCards } from '@/components/home/HomeModuleCards';
import { HomeRecentWinners } from '@/components/home/HomeRecentWinners';

const SYNC_INTERVAL_MS = 30000;

export default function HomePage() {
  const [vouchers, setVouchers] = useState<Voucher[]>(() => getStoredVouchers());
  const [winners, setWinners] = useState<DrawResult[]>(() => getStoredDrawResults());
  const [session, setSession] = useState<UserSession | null>(() => getCurrentSession());
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const loadData = useCallback(() => {
    setSession(getCurrentSession());
    setVouchers(getStoredVouchers());
    setWinners(getStoredDrawResults());
  }, []);

  const runSync = useCallback(async () => {
    // Anonim tidak boleh men-download data operasional (PII) dari server.
    if (!getCurrentSession()) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      return;
    }
    setIsOnline(true);
    setIsSyncing(true);
    try {
      const ok = await syncFromSupabase();
      if (ok) {
        loadData();
        setLastSyncedAt(new Date());
      }
    } finally {
      setIsSyncing(false);
    }
  }, [loadData]);

  useEffect(() => {
    refreshSession().then(() => loadData());

    const syncTimer = window.setTimeout(() => {
      runSync();
    }, 0);

    const interval = window.setInterval(() => {
      runSync();
    }, SYNC_INTERVAL_MS);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') runSync();
    };
    const handleFocus = () => {
      runSync();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener(SIKUJA_EVENT_NAME, loadData);

    return () => {
      window.clearTimeout(syncTimer);
      window.clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener(SIKUJA_EVENT_NAME, loadData);
    };
  }, [runSync, loadData]);

  const totalTerjual = vouchers.length;
  const totalFisik = vouchers.filter((v) => v.type === 'fisik').length;
  const totalNonFisik = vouchers.filter((v) => v.type === 'non-fisik').length;
  const totalCheckin = vouchers.filter((v) => v.status === 'checkin' || v.status === 'menang' || v.status === 'diklaim').length;
  const claimedCount = winners.filter((w) => w.claimed).length;

  const showSyncBanner = !isOnline || isSyncing || lastSyncedAt;

  return (
    <div className="space-y-10 pb-12">
      {/* Sync / Offline Status Indicator */}
      {showSyncBanner && (
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-xs font-bold shadow-xs ${
            !isOnline
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-white border border-slate-200 text-slate-600'
          }`}
        >
          {!isOnline ? (
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>
                Offline — menampilkan data tersimpan di perangkat ini. Cek koneksi untuk data terbaru.
              </span>
            </div>
          ) : isSyncing ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
              <span>Menyinkronkan data terbaru...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Data tersinkron{' '}
                {lastSyncedAt?.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          {!isOnline && (
            <button
              onClick={() => runSync()}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all cursor-pointer active:scale-95 shrink-0 disabled:opacity-50"
            >
              Coba Lagi
            </button>
          )}
        </div>
      )}

      {/* Hero Banner Section */}
      <HomeHeroBanner />

      {/* Cara Beli Kupon (publik, untuk peserta jalan sehat) */}
      {!session && <HomeBuyCoupons />}

      {/* Login CTA for anonymous visitors */}
      {!session && (
        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-sm animate-fade-in">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#E70013] text-white flex items-center justify-center shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Akses Panitia</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Login dengan PIN petugas Anda untuk melihat dashboard operasional, penjualan, check-in, dan pengundian.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#E70013] hover:bg-[#E70013]/90 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            Login Petugas
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      )}

      {/* Live Stat Summary Section (hanya untuk panitia yang login) */}
      {session && (
        <HomeStatCards
          totalTerjual={totalTerjual}
          totalFisik={totalFisik}
          totalNonFisik={totalNonFisik}
          totalCheckin={totalCheckin}
          winnersCount={winners.length}
          claimedCount={claimedCount}
        />
      )}

      {/* Role-Based Module Cards Section */}
      {session && <HomeModuleCards session={session} />}

      {/* Live Recent Winners Section (hanya untuk panitia yang login) */}
      {session && <HomeRecentWinners winners={winners} lastSyncedAt={lastSyncedAt} />}
    </div>
  );
}

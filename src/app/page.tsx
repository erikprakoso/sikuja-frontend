'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getStoredVouchers, getStoredDrawResults, syncFromSupabase, SIKUJA_EVENT_NAME } from '@/lib/storage';
import { getCurrentSession, refreshSession } from '@/lib/services/auth';
import { Voucher, DrawResult, UserSession } from '@/types';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

import { HomeHeroBanner } from '@/components/home/HomeHeroBanner';
import { HomeBuyCoupons } from '@/components/home/HomeBuyCoupons';
import { HomeStatCards } from '@/components/home/HomeStatCards';
import { HomeModuleCards } from '@/components/home/HomeModuleCards';
import { HomeRecentWinners } from '@/components/home/HomeRecentWinners';

const SYNC_INTERVAL_MS = 30000;

export default function HomePage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [winners, setWinners] = useState<DrawResult[]>([]);
  const [session, setSession] = useState<UserSession | null>(null);
  const [mounted, setMounted] = useState(false);
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
    setMounted(true);
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
      {mounted && !session && <HomeBuyCoupons />}

      {/* Live Stat Summary Section (hanya untuk panitia yang login) */}
      {mounted && session && (
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
      {mounted && session && <HomeModuleCards session={session} />}

      {/* Live Recent Winners Section (hanya untuk panitia yang login) */}
      {mounted && session && <HomeRecentWinners winners={winners} lastSyncedAt={lastSyncedAt} />}
    </div>
  );
}

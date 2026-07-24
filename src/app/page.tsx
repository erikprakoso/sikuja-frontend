'use client';

import React, { useState, useEffect } from 'react';
import { getStoredVouchers, getStoredTransactions, getStoredDrawResults, syncFromSupabase, SIVOJA_EVENT_NAME } from '@/lib/storage';
import { getCurrentSession } from '@/lib/services/auth';
import { Voucher, Transaction, DrawResult, UserSession } from '@/types';

import { HomeHeroBanner } from '@/components/home/HomeHeroBanner';
import { HomeStatCards } from '@/components/home/HomeStatCards';
import { HomeModuleCards } from '@/components/home/HomeModuleCards';
import { HomeRecentWinners } from '@/components/home/HomeRecentWinners';

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
  const claimedCount = winners.filter((w) => w.claimed).length;

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Banner Section */}
      <HomeHeroBanner
        searchToken={searchToken}
        setSearchToken={setSearchToken}
      />

      {/* Live Stat Summary Section */}
      <HomeStatCards
        totalTerjual={totalTerjual}
        totalFisik={totalFisik}
        totalNonFisik={totalNonFisik}
        totalCheckin={totalCheckin}
        winnersCount={winners.length}
        claimedCount={claimedCount}
      />

      {/* Role-Based Module Cards Section */}
      {session && <HomeModuleCards session={session} />}

      {/* Live Recent Winners Section */}
      <HomeRecentWinners winners={winners} />
    </div>
  );
}

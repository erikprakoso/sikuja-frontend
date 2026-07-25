'use client';

import React, { useState, useEffect } from 'react';
import { getStoredDrawResults, getStoredVouchers, syncFromSupabase, SIKUJA_EVENT_NAME } from '@/lib/storage';
import { DrawResult, Voucher } from '@/types';

import { VerifikasiHeader } from '@/components/verifikasi/VerifikasiHeader';
import { VerifikasiForm } from '@/components/verifikasi/VerifikasiForm';
import { UnclaimedWinnersList } from '@/components/verifikasi/UnclaimedWinnersList';

export default function VerifikasiPanggungPage() {
  const [code, setCode] = useState('');
  const [resultMsg, setResultMsg] = useState<{ success: boolean; message: string } | null>(null);
  const [drawResults, setDrawResults] = useState<DrawResult[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);

  const refreshData = () => {
    setDrawResults(getStoredDrawResults());
    setVouchers(getStoredVouchers());
  };

  useEffect(() => {
    syncFromSupabase().then(() => refreshData());
    window.addEventListener(SIKUJA_EVENT_NAME, refreshData);
    return () => {
      window.removeEventListener(SIKUJA_EVENT_NAME, refreshData);
    };
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setResultMsg({ success: true, message: data.message });
        setCode('');
      } else {
        setResultMsg({ success: false, message: data.error || 'Gagal memproses verifikasi klaim.' });
      }
    } catch {
      setResultMsg({ success: false, message: 'Gagal terhubung ke server verifikasi.' });
    }
    refreshData();
  };

  const handleQuickClaim = async (voucherCode: string) => {
    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCode }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setResultMsg({ success: true, message: data.message });
      } else {
        setResultMsg({ success: false, message: data.error || 'Gagal memproses verifikasi klaim.' });
      }
    } catch {
      setResultMsg({ success: false, message: 'Gagal terhubung ke server verifikasi.' });
    }
    refreshData();
  };

  const unclaimedWinners = drawResults.filter((r) => !r.claimed);

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {/* Header Banner */}
      <VerifikasiHeader />

      {/* Verification Input Box */}
      <VerifikasiForm
        code={code}
        setCode={setCode}
        resultMsg={resultMsg}
        onVerify={handleVerify}
      />

      {/* Active Unclaimed Winners List */}
      <UnclaimedWinnersList
        unclaimedWinners={unclaimedWinners}
        onQuickClaim={handleQuickClaim}
      />
    </div>
  );
}

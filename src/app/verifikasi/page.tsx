'use client';

import React, { useState, useEffect } from 'react';
import { getStoredDrawResults, getStoredVouchers, syncFromSupabase, SIKUJA_EVENT_NAME } from '@/lib/storage';
import { DrawResult, Voucher } from '@/types';

import { RequireAuth } from '@/components/auth/RequireAuth';
import { VerifikasiHeader } from '@/components/verifikasi/VerifikasiHeader';
import { VerifikasiForm } from '@/components/verifikasi/VerifikasiForm';
import { UnclaimedWinnersList } from '@/components/verifikasi/UnclaimedWinnersList';

export default function VerifikasiPanggungPage() {
  const [code, setCode] = useState('');
  const [resultMsg, setResultMsg] = useState<{ success: boolean; message: string } | null>(null);
  const [drawResults, setDrawResults] = useState<DrawResult[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [processingCode, setProcessingCode] = useState<string | null>(null);

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
    if (!code.trim() || isVerifying) return;

    setIsVerifying(true);
    setResultMsg(null);

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
        refreshData();
      } else {
        setResultMsg({ success: false, message: data.error || 'Gagal memproses verifikasi klaim.' });
      }
    } catch {
      setResultMsg({ success: false, message: 'Gagal terhubung ke server verifikasi.' });
    }
    setIsVerifying(false);
  };

  const handleQuickClaim = async (voucherCode: string) => {
    if (processingCode || isVerifying) return;

    setProcessingCode(voucherCode);
    setResultMsg(null);

    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCode }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setResultMsg({ success: true, message: data.message });
        refreshData();
      } else {
        setResultMsg({ success: false, message: data.error || 'Gagal memproses verifikasi klaim.' });
      }
    } catch {
      setResultMsg({ success: false, message: 'Gagal terhubung ke server verifikasi.' });
    }
    setProcessingCode(null);
  };

  const unclaimedWinners = drawResults.filter((r) => !r.claimed);

  return (
    <RequireAuth roles={['verifikator', 'admin']}>
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {isVerifying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-12 h-12 border-4 border-[#E70013] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-700">Memproses verifikasi klaim...</p>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        {/* Header Banner */}
        <VerifikasiHeader />

        {/* Verification Input Box */}
        <VerifikasiForm
          code={code}
          setCode={setCode}
          resultMsg={resultMsg}
          isVerifying={isVerifying}
          onVerify={handleVerify}
        />

        {/* Active Unclaimed Winners List */}
        <UnclaimedWinnersList
          unclaimedWinners={unclaimedWinners}
          processingCode={processingCode}
          onQuickClaim={handleQuickClaim}
        />
      </div>
    </div>
    </RequireAuth>
  );
}

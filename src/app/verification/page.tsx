'use client';

import React, { useState, useEffect } from 'react';
import { getStoredDrawResults, getStoredVouchers, syncFromSupabase, SIKUJA_EVENT_NAME } from '@/lib/storage';
import { DrawResult, Voucher } from '@/types';

import { RequireAuth } from '@/components/auth/RequireAuth';
import { VerifikasiForm } from '@/components/verifikasi/VerifikasiForm';
import { UnclaimedWinnersList } from '@/components/verifikasi/UnclaimedWinnersList';

export default function VerificationPage() {
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
    const trimmed = code.trim();
    if (!trimmed || isVerifying) return;

    setIsVerifying(true);
    setResultMsg(null);

    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setCode('');
        await applyClaimResult(trimmed, true, data.message);
      } else {
        await applyClaimResult(trimmed, false, data.error || 'Gagal memproses verifikasi klaim.');
      }
    } catch {
      await applyClaimResult(trimmed, false, 'Gagal terhubung ke server verifikasi.');
    } finally {
      setIsVerifying(false);
    }
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
        await applyClaimResult(voucherCode, true, data.message);
      } else {
        await applyClaimResult(voucherCode, false, data.error || 'Gagal memproses verifikasi klaim.');
      }
    } catch {
      await applyClaimResult(voucherCode, false, 'Gagal terhubung ke server verifikasi.');
    } finally {
      setProcessingCode(null);
    }
  };

  // Update UI seketika (optimistic) lalu sinkron data dari server supaya
  // daftar "menunggu klaim" tidak menampilkan pemenang yang sudah diklaim
  // (localStorage lama tidak lagi merefleksikan status terbaru di database).
  const applyClaimResult = async (voucherCode: string, success: boolean, message: string) => {
    setResultMsg({ success, message });
    if (!success) return;

    setDrawResults((prev) =>
      prev.map((r) =>
        r.voucher_code === voucherCode ? { ...r, claimed: true, claimed_at: new Date().toISOString() } : r
      )
    );
    void syncFromSupabase().then(refreshData);
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
        <VerifikasiForm
          code={code}
          setCode={setCode}
          resultMsg={resultMsg}
          isVerifying={isVerifying}
          onVerify={handleVerify}
        />

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

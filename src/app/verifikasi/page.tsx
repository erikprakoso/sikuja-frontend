'use client';

import React, { useState, useEffect } from 'react';
import { claimStagePrize } from '@/lib/services/voucher';
import { getStoredDrawResults, getStoredVouchers, SIVOJA_EVENT_NAME } from '@/lib/storage';
import { DrawResult, Voucher } from '@/types';

import { VerifikasiHeader } from '@/components/verifikasi/VerifikasiHeader';
import { VerifikasiForm } from '@/components/verifikasi/VerifikasiForm';
import { UnclaimedWinnersList } from '@/components/verifikasi/UnclaimedWinnersList';

export default function VerifikasiPanggungPage() {
  const [code, setCode] = useState('');
  const [resultMsg, setResultMsg] = useState<{ success: boolean; message: string } | null>(null);
  const [drawResults, setDrawResults] = useState<DrawResult[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);

  const loadData = () => {
    setDrawResults(getStoredDrawResults());
    setVouchers(getStoredVouchers());
  };

  useEffect(() => {
    loadData();
    if (typeof window !== 'undefined') {
      window.addEventListener(SIVOJA_EVENT_NAME, loadData);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(SIVOJA_EVENT_NAME, loadData);
      }
    };
  }, []);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const res = claimStagePrize(code.trim());
    setResultMsg(res);
    if (res.success) {
      setCode('');
      loadData();
    }
  };

  const handleQuickClaim = (voucherCode: string) => {
    const res = claimStagePrize(voucherCode);
    setResultMsg(res);
    loadData();
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

'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { getStoredPrizes, getStoredVouchers, syncFromSupabase, SIKUJA_EVENT_NAME } from '@/lib/storage';
import { soundManager } from '@/lib/services/audio';
import { Prize, Voucher } from '@/types';
import { Trophy, AlertCircle } from 'lucide-react';

import { RequireAuth } from '@/components/auth/RequireAuth';
import { UndianHeader } from '@/components/undian/UndianHeader';
import { PrizeSelectorGrid } from '@/components/undian/PrizeSelectorGrid';
import { DigitSlotsDisplay } from '@/components/undian/DigitSlotsDisplay';
import { WinnerBanner } from '@/components/undian/WinnerBanner';
import { DrawControls } from '@/components/undian/DrawControls';

export default function LayarUndianPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>('');
  const [eligibleCount, setEligibleCount] = useState<number>(0);
  
  const [isRolling, setIsRolling] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [displayDigits, setDisplayDigits] = useState<string>('00000');
  
  const [candidateVoucher, setCandidateVoucher] = useState<Voucher | null>(null);
  const [isConfirmedWinner, setIsConfirmedWinner] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [lastPoolSize, setLastPoolSize] = useState<number | null>(null);

  const rollIntervalRef = useRef<number | null>(null);
  const rollTimeoutRef = useRef<number | null>(null);

  // Reads doorprize & eligible count from SERVER first (same source as admin),
  // falls back to local data so the stage always shows the latest prizes
  // even if the /api/data localStorage sync is stale or failed.
  const refreshLocalData = async () => {
    let p = getStoredPrizes();
    let eligible = getStoredVouchers().filter((x) => x.status === 'checkin').length;

    try {
      const res = await fetch('/api/keuangan/doorprize');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.prizes)) p = data.prizes;
        if (typeof data.eligibleCount === 'number') eligible = data.eligibleCount;
      }
    } catch {
      // fallback: gunakan data lokal hasil sync
    }

    setPrizes(p);

    const availablePrizes = p.filter((item) => item.drawn_count < item.stock);

    setSelectedPrizeId((prevId) => {
      const isStillAvailable = availablePrizes.some((item) => item.id === prevId);
      if (isStillAvailable) return prevId;
      return availablePrizes.length > 0 ? availablePrizes[0].id : '';
    });

    setEligibleCount(eligible);
  };

  useEffect(() => {
    // One-time sync on mount, then refresh local state
    syncFromSupabase().then(() => {
      refreshLocalData();
    });

    // Listen to storage changes from other actions (checkin, confirm, etc.) — local reads only
    window.addEventListener(SIKUJA_EVENT_NAME, refreshLocalData);
    return () => {
      window.removeEventListener(SIKUJA_EVENT_NAME, refreshLocalData);
    };
  }, []);

  // Auto-refresh berkala: tarik data terbaru dari server tiap 30 dtk agar
  // pool peserta (voucher status 'checkin') dan stok hadiah selalu segar
  // tanpa perlu reload manual, terutama saat layar undian dibiarkan terbuka.
  useEffect(() => {
    const interval = setInterval(() => {
      void syncFromSupabase().then(() => refreshLocalData());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Bersih-bersih saat keluar halaman: hentikan roll & suara drumroll agar
  // tidak ada interval/timeout yang berjalan di belakang layar.
  useEffect(() => {
    return () => {
      if (rollIntervalRef.current !== null) clearInterval(rollIntervalRef.current);
      if (rollTimeoutRef.current !== null) clearTimeout(rollTimeoutRef.current);
      soundManager.stopDrumroll();
    };
  }, []);

  const triggerConfetti = () => {
    // Left side flare confetti burst
    confetti({
      particleCount: 80,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.65 },
      colors: ['#E70013', '#ffffff', '#ff4d5a'],
    });
    // Right side flare confetti burst
    confetti({
      particleCount: 80,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.65 },
      colors: ['#E70013', '#ffffff', '#ff4d5a'],
    });
  };

  const handleStartDraw = async (excludeCode?: unknown) => {
    if (isRolling || !selectedPrizeId) return;
    setIsRolling(true);
    setErrorMsg('');
    setCandidateVoucher(null);
    setIsConfirmedWinner(false);

    // Pastikan excludeCode adalah string murni, bukan objek Event dari tombol
    const validExcludeCode = typeof excludeCode === 'string' ? excludeCode : undefined;

    try {
      const res = await fetch('/api/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prizeId: selectedPrizeId,
          ...(validExcludeCode ? { excludeCode: validExcludeCode } : {}),
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        const rawErr = data.error || 'Gagal memproses pengundian.';
        const errStr = typeof rawErr === 'string' ? rawErr : (rawErr.message || String(rawErr));
        setErrorMsg(errStr);
        setIsRolling(false);
        return;
      }

      const candidate: Voucher = data.candidate;
      if (typeof data.audit?.pool_size === 'number') {
        setLastPoolSize(data.audit.pool_size);
      }

      soundManager.startDrumroll();

      rollIntervalRef.current = window.setInterval(() => {
        const random5Digit = Math.floor(Math.random() * 100000)
          .toString()
          .padStart(5, '0');
        setDisplayDigits(random5Digit);
        soundManager.playTick();
      }, 85);

      rollTimeoutRef.current = window.setTimeout(() => {
        if (rollIntervalRef.current !== null) {
          clearInterval(rollIntervalRef.current);
          rollIntervalRef.current = null;
        }
        rollTimeoutRef.current = null;

        soundManager.stopDrumroll();
        soundManager.playVictoryFanfare();
        triggerConfetti();

        setIsRolling(false);
        setDisplayDigits(candidate.code);
        setCandidateVoucher(candidate);
      }, 3200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Draw error message:', msg);
      setErrorMsg(msg || 'Gagal terhubung ke server pengundian.');
      setIsRolling(false);
    }
  };

  const handleConfirmWinner = async () => {
    if (!candidateVoucher || !selectedPrizeId || isConfirming) return;
    setIsConfirming(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/draw/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: candidateVoucher.code, prizeId: selectedPrizeId }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        const rawErr = data.error || 'Gagal mengonfirmasi pemenang.';
        const errStr = typeof rawErr === 'string' ? rawErr : (rawErr.message || String(rawErr));
        setErrorMsg(errStr);
        setIsConfirming(false);
        return;
      }

      setIsConfirmedWinner(true);
      setIsConfirming(false);

      soundManager.playVictoryFanfare();
      triggerConfetti();

      // Sync fresh data from server so drawn_count is updated, then refresh UI.
      // This ensures the prize counter reflects the new draw and auto-advances
      // to the next available prize category if current one is exhausted.
      await syncFromSupabase();
      refreshLocalData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Confirm error message:', msg);
      setErrorMsg(msg || 'Gagal terhubung ke server untuk mengonfirmasi.');
      setIsConfirming(false);
    }
  };

  const handleForfeitAndRedraw = () => {
    if (!candidateVoucher) return;
    const forfeitedCode = candidateVoucher.code;
    setCandidateVoucher(null);
    setIsConfirmedWinner(false);
    handleStartDraw(forfeitedCode);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const currentPrize = prizes.find((p) => p.id === selectedPrizeId);

  return (
    <RequireAuth roles={['mc', 'admin']}>
    <div className="space-y-8 py-4 max-w-6xl mx-auto">
      {/* Top Controls Bar */}
      <UndianHeader
        eligibleCount={eligibleCount}
        poolSize={lastPoolSize}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Prize Selector Grid */}
      <PrizeSelectorGrid
        prizes={prizes}
        selectedPrizeId={selectedPrizeId}
        isRolling={isRolling}
        onSelectPrize={(id) => {
          setSelectedPrizeId(id);
          setCandidateVoucher(null);
          setIsConfirmedWinner(false);
        }}
      />

      {/* BIG STAGE SCREEN (PROYEKTOR MODE) */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-8 sm:p-14 text-center space-y-8 shadow-xl">
        {/* Selected Prize Badge */}
        {currentPrize && (
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#E70013] text-white text-sm font-black uppercase tracking-widest shadow-lg">
            <Trophy className="w-5 h-5 text-white animate-bounce" />
            Kategori Hadiah: {currentPrize.name}
          </div>
        )}

        {/* 5-DIGIT DISPLAY SLOTS */}
        <DigitSlotsDisplay
          displayDigits={displayDigits}
          isRolling={isRolling}
          winnerVoucher={isConfirmedWinner ? candidateVoucher : null}
        />

        {/* Candidate or Winner Announcement Banner */}
        {candidateVoucher && (
          <WinnerBanner
            voucher={candidateVoucher}
            isConfirmed={isConfirmedWinner}
          />
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-[#E70013] text-white text-sm font-black inline-flex items-center gap-2 max-w-md shadow-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-white" />
            {errorMsg}
          </div>
        )}

        {/* Draw Action Buttons */}
        <DrawControls
          isRolling={isRolling}
          isConfirming={isConfirming}
          candidateVoucher={candidateVoucher}
          isConfirmed={isConfirmedWinner}
          selectedPrizeId={selectedPrizeId}
          onStartDraw={() => handleStartDraw()}
          onConfirmWinner={handleConfirmWinner}
          onForfeitAndRedraw={handleForfeitAndRedraw}
        />
      </div>
    </div>
    </RequireAuth>
  );
}

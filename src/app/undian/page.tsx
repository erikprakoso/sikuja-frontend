'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { getStoredPrizes, getStoredVouchers, syncFromSupabase, SIVOJA_EVENT_NAME } from '@/lib/storage';
import { soundManager } from '@/lib/services/audio';
import { Prize, Voucher } from '@/types';
import { Trophy, AlertCircle } from 'lucide-react';

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
  const [displayDigits, setDisplayDigits] = useState<string>('00000');
  const [winnerVoucher, setWinnerVoucher] = useState<Voucher | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const rollIntervalRef = useRef<number | null>(null);

  const loadData = async () => {
    await syncFromSupabase();

    const p = getStoredPrizes();
    setPrizes(p);
    if (p.length > 0 && !selectedPrizeId) {
      setSelectedPrizeId(p[0].id);
    }

    const v = getStoredVouchers();
    const eligible = v.filter((x) => x.status === 'checkin').length;
    setEligibleCount(eligible);
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

  const triggerConfetti = () => {
    // Lightweight single burst from left & right (Zero CPU/GPU lag)
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      colors: ['#ef4444', '#f59e0b', '#ffffff', '#10b981'],
    });
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      colors: ['#ef4444', '#f59e0b', '#ffffff', '#10b981'],
    });
  };

  const handleStartDraw = async (isForfeit: boolean = false) => {
    if (isRolling || !selectedPrizeId) return;
    setIsRolling(true); // Lock immediately to prevent double-click
    setErrorMsg('');

    const forfeitCode = isForfeit && winnerVoucher ? winnerVoucher.code : undefined;
    setWinnerVoucher(null);

    try {
      const res = await fetch('/api/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prizeId: selectedPrizeId, forfeitCode }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Gagal mengocok undian.');
        setIsRolling(false); // Unlock on error
        return;
      }

      const winner = data.winnerVoucher;

      soundManager.startDrumroll();

      // Fast digit shuffling visual effect (3 seconds)
      rollIntervalRef.current = window.setInterval(() => {
        const random5Digit = Math.floor(Math.random() * 100000)
          .toString()
          .padStart(5, '0');
        setDisplayDigits(random5Digit);
      }, 80);

      // After 3.2 seconds: stop everything cleanly and reveal winner
      setTimeout(() => {
        // 1. Stop the digit shuffle interval
        if (rollIntervalRef.current !== null) {
          clearInterval(rollIntervalRef.current);
          rollIntervalRef.current = null;
        }

        // 2. Stop ALL sounds (drumroll + ticks)
        soundManager.stopDrumroll();

        // 3. Reveal winner
        setIsRolling(false);
        setDisplayDigits(winner.code);
        setWinnerVoucher(winner);

        // 4. Play short victory fanfare & confetti
        soundManager.playVictoryFanfare();
        triggerConfetti();
        loadData();
      }, 3200);
    } catch (err) {
      console.error('Draw error:', err);
      setErrorMsg('Gagal terhubung ke server undian.');
      setIsRolling(false); // Unlock on error
    }
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
    <div className="space-y-8 py-4 max-w-6xl mx-auto">
      {/* Top Controls Bar */}
      <UndianHeader
        eligibleCount={eligibleCount}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Prize Selector Grid */}
      <PrizeSelectorGrid
        prizes={prizes}
        selectedPrizeId={selectedPrizeId}
        isRolling={isRolling}
        onSelectPrize={(id) => {
          setSelectedPrizeId(id);
          setWinnerVoucher(null);
        }}
      />

      {/* BIG STAGE SCREEN (PROYEKTOR MODE) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-red-950 border-4 border-amber-500/40 p-8 sm:p-14 text-center space-y-8 shadow-2xl shadow-red-950/80">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Selected Prize Badge */}
        {currentPrize && (
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-sm font-black uppercase tracking-widest shadow-lg">
            <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />
            Hadiah: {currentPrize.name}
          </div>
        )}

        {/* 5-DIGIT DISPLAY SLOTS */}
        <DigitSlotsDisplay
          displayDigits={displayDigits}
          isRolling={isRolling}
          winnerVoucher={winnerVoucher}
        />

        {/* Winner Announcement Banner */}
        {winnerVoucher && <WinnerBanner winnerVoucher={winnerVoucher} />}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-950/80 border border-red-800 text-red-200 text-sm font-bold inline-flex items-center gap-2 max-w-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Draw Action Buttons */}
        <DrawControls
          isRolling={isRolling}
          winnerVoucher={winnerVoucher}
          onStartDraw={handleStartDraw}
        />
      </div>
    </div>
  );
}

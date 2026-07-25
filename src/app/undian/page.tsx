'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { getStoredPrizes, getStoredVouchers, syncFromSupabase, SIKUJA_EVENT_NAME } from '@/lib/storage';
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
  const [isConfirming, setIsConfirming] = useState(false);
  const [displayDigits, setDisplayDigits] = useState<string>('00000');
  
  const [candidateVoucher, setCandidateVoucher] = useState<Voucher | null>(null);
  const [isConfirmedWinner, setIsConfirmedWinner] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const rollIntervalRef = useRef<number | null>(null);

  // Reads local data only — no network call, no infinite loop
  const refreshLocalData = () => {
    const p = getStoredPrizes();
    setPrizes(p);

    const availablePrizes = p.filter((item) => item.drawn_count < item.stock);

    setSelectedPrizeId((prevId) => {
      const isStillAvailable = availablePrizes.some((item) => item.id === prevId);
      if (isStillAvailable) return prevId;
      return availablePrizes.length > 0 ? availablePrizes[0].id : '';
    });

    const v = getStoredVouchers();
    const eligible = v.filter((x) => x.status === 'checkin').length;
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

  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      colors: ['#E70013', '#ffffff'],
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      colors: ['#E70013', '#ffffff'],
    });
  };

  const handleStartDraw = async () => {
    if (isRolling || !selectedPrizeId) return;
    setIsRolling(true);
    setErrorMsg('');
    setCandidateVoucher(null);
    setIsConfirmedWinner(false);

    try {
      const res = await fetch('/api/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prizeId: selectedPrizeId }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Gagal memproses pengundian.');
        setIsRolling(false);
        return;
      }

      const candidate: Voucher = data.candidate;

      soundManager.startDrumroll();

      rollIntervalRef.current = window.setInterval(() => {
        const random5Digit = Math.floor(Math.random() * 100000)
          .toString()
          .padStart(5, '0');
        setDisplayDigits(random5Digit);
      }, 80);

      setTimeout(() => {
        if (rollIntervalRef.current !== null) {
          clearInterval(rollIntervalRef.current);
          rollIntervalRef.current = null;
        }

        soundManager.stopDrumroll();

        setIsRolling(false);
        setDisplayDigits(candidate.code);
        setCandidateVoucher(candidate);
      }, 3200);
    } catch (err) {
      console.error('Draw error:', err);
      setErrorMsg('Gagal terhubung ke server pengundian.');
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
        setErrorMsg(data.error || 'Gagal mengonfirmasi pemenang.');
        setIsConfirming(false);
        return;
      }

      setIsConfirmedWinner(true);
      setIsConfirming(false);

      soundManager.playVictoryFanfare();
      triggerConfetti();
      refreshLocalData();
    } catch (err) {
      console.error('Confirm error:', err);
      setErrorMsg('Gagal terhubung ke server untuk mengonfirmasi.');
      setIsConfirming(false);
    }
  };

  const handleForfeitAndRedraw = () => {
    setCandidateVoucher(null);
    setIsConfirmedWinner(false);
    handleStartDraw();
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
          setCandidateVoucher(null);
          setIsConfirmedWinner(false);
        }}
      />

      {/* BIG STAGE SCREEN (PROYEKTOR MODE) */}
      <div className="relative overflow-hidden rounded-3xl bg-white border-4 border-[#E70013] p-8 sm:p-14 text-center space-y-8 shadow-2xl">
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
          onStartDraw={handleStartDraw}
          onConfirmWinner={handleConfirmWinner}
          onForfeitAndRedraw={handleForfeitAndRedraw}
        />
      </div>
    </div>
  );
}

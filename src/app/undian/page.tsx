'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { getStoredPrizes, getStoredVouchers, SIVOJA_EVENT_NAME } from '@/lib/storage';
import { drawWinnerForPrize } from '@/lib/services/voucher';
import { soundManager } from '@/lib/services/audio';
import { Prize, Voucher } from '@/types';
import {
  Trophy,
  Sparkles,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Play,
  Flame,
  Star,
  Users,
} from 'lucide-react';

export default function LayarUndianPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>('');
  const [eligibleCount, setEligibleCount] = useState<number>(0);
  
  const [isRolling, setIsRolling] = useState(false);
  const [displayDigits, setDisplayDigits] = useState<string>('00000');
  const [winnerVoucher, setWinnerVoucher] = useState<Voucher | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const rollIntervalRef = useRef<number | null>(null);

  const loadData = () => {
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
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ef4444', '#f59e0b', '#ffffff'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ef4444', '#f59e0b', '#ffffff'],
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const handleStartDraw = () => {
    if (isRolling || !selectedPrizeId) return;
    setErrorMsg('');
    setWinnerVoucher(null);

    // Pre-validate eligibility before starting animation
    const result = drawWinnerForPrize(selectedPrizeId);
    if (!result.success || !result.winnerVoucher) {
      setErrorMsg(result.error || 'Gagal mengocok undian.');
      return;
    }

    setIsRolling(true);
    soundManager.startDrumroll();

    // Fast digit shuffling visual effect (3 seconds)
    const startTime = Date.now();
    rollIntervalRef.current = window.setInterval(() => {
      const random5Digit = Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, '0');
      setDisplayDigits(random5Digit);
      soundManager.playTick();

      if (Date.now() - startTime >= 3200) {
        // Stop rolling & reveal winner
        if (rollIntervalRef.current !== null) {
          clearInterval(rollIntervalRef.current);
          rollIntervalRef.current = null;
        }

        setIsRolling(false);
        setDisplayDigits(result.winnerVoucher!.code);
        setWinnerVoucher(result.winnerVoucher!);
        soundManager.playVictoryFanfare();
        triggerConfetti();
        loadData();
      }
    }, 80);
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950 border border-amber-700 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5" />
            Layar Undian Panggung Utama
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Pengocokan Kode Acak</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Peserta Eligible</span>
            <span className="text-lg font-black text-emerald-400 font-mono flex items-center gap-1">
              <Users className="w-4 h-4 inline" /> {eligibleCount} Kode
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
            title="Layar Penuh Proyektor"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Prize Selector Grid */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Star className="w-4 h-4 text-amber-400" />
          Pilih Hadiah yang Akan Diundi:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {prizes.map((p) => {
            const isSelected = p.id === selectedPrizeId;
            const isSoldOut = p.drawn_count >= p.stock;
            return (
              <button
                key={p.id}
                disabled={isRolling}
                onClick={() => {
                  setSelectedPrizeId(p.id);
                  setWinnerVoucher(null);
                }}
                className={`p-3 rounded-2xl text-left border transition-all relative overflow-hidden ${
                  isSelected
                    ? 'bg-amber-950/80 border-amber-500 text-white shadow-lg shadow-amber-950/60 scale-105 ring-2 ring-amber-400/40'
                    : isSoldOut
                    ? 'bg-slate-950/50 border-slate-900 text-slate-600 opacity-60'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-bold text-amber-400">#Hadiah {p.order_num}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                    {p.drawn_count}/{p.stock}
                  </span>
                </div>
                <p className="text-xs font-black truncate mt-1">{p.name}</p>
              </button>
            );
          })}
        </div>
      </div>

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
        <div className="py-4">
          <div className="inline-flex items-center justify-center gap-3 sm:gap-6 bg-slate-950/90 border-4 border-slate-800 p-4 sm:p-8 rounded-3xl shadow-inner max-w-full">
            {displayDigits.split('').map((digit, idx) => (
              <div
                key={idx}
                className={`w-14 h-20 sm:w-24 sm:h-36 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 ${
                  winnerVoucher
                    ? 'border-amber-400 text-amber-400 shadow-lg shadow-amber-500/50 scale-105'
                    : isRolling
                    ? 'border-red-500 text-white animate-pulse'
                    : 'border-slate-700 text-slate-200'
                } flex items-center justify-center font-mono text-4xl sm:text-7xl font-black tracking-tighter shadow-2xl transition-all`}
              >
                {digit}
              </div>
            ))}
          </div>
        </div>

        {/* Winner Announcement Banner */}
        {winnerVoucher && (
          <div className="p-6 rounded-3xl bg-amber-500/20 border border-amber-400/60 max-w-xl mx-auto space-y-2 animate-bounce-subtle shadow-2xl">
            <div className="inline-flex items-center gap-2 text-amber-300 font-extrabold text-sm uppercase">
              <Sparkles className="w-5 h-5" />
              Pemenang Sah Ditarik!
            </div>
            <p className="text-3xl font-black text-white font-mono tracking-widest">
              KODE VOUCHER: {winnerVoucher.code}
            </p>
            <p className="text-xs text-amber-200">
              Silakan pemegang voucher maju ke panggung dengan membawa bukti fisik / e-voucher!
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-950/80 border border-red-800 text-red-200 text-sm font-bold inline-flex items-center gap-2 max-w-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Draw Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleStartDraw}
            disabled={isRolling}
            className={`px-10 py-5 rounded-2xl text-xl font-black tracking-wide shadow-2xl transition-all flex items-center gap-3 ${
              isRolling
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-600 via-amber-500 to-red-600 hover:scale-105 text-slate-950 shadow-amber-500/40 ring-4 ring-amber-400/30'
            }`}
          >
            <Play className="w-6 h-6 fill-current" />
            {isRolling ? 'Mengocok Kode...' : winnerVoucher ? 'Tarik Lagi (Kocok Ulang)' : 'Kocok / Tarik Kode!'}
          </button>
        </div>
      </div>
    </div>
  );
}

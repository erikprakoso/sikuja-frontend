'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { getStoredPrizes, getStoredVouchers, syncFromSupabase, SIKUJA_EVENT_NAME, sortPrizesByUnitPrice } from '@/lib/storage';
import { soundManager } from '@/lib/services/audio';
import { Prize, Voucher } from '@/types';
import { Trophy, AlertCircle } from 'lucide-react';

import { RequireAuth } from '@/components/auth/RequireAuth';
import { UndianHeader } from '@/components/undian/UndianHeader';
import { PrizeSelectorGrid } from '@/components/undian/PrizeSelectorGrid';
import { DigitSlotsDisplay } from '@/components/undian/DigitSlotsDisplay';
import { WinnersPanel } from '@/components/undian/WinnersPanel';
import { DrawControls } from '@/components/undian/DrawControls';

// Acak cepat daftar kode kupon untuk tampilan roll (Fisher–Yates, CSPRNG).
// Pemenang TIDAK ditentukan di sini — kode yang membeku saat Stop itulah yang
// diverifikasi & dicatat server di /api/draw/stop.
function shuffleCodes(codes: string[]): string[] {
  const arr = [...codes];
  for (let i = arr.length - 1; i > 0; i--) {
    const j =
      typeof window !== 'undefined' && window.crypto
        ? window.crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1)
        : Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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
  const [winners, setWinners] = useState<Voucher[]>([]);

  const rollIntervalRef = useRef<number | null>(null);
  const candidateRef = useRef<Voucher | null>(null);
  const poolCodesRef = useRef<string[]>([]);
  const poolIdxRef = useRef(0);
  const currentDisplayCodeRef = useRef<string>('00000');
  const resolvingRef = useRef(false);

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

    const availablePrizes = sortPrizesByUnitPrice(p).filter((item) => item.drawn_count < item.stock);

    setSelectedPrizeId((prevId) => {
      const isStillAvailable = availablePrizes.some((item) => item.id === prevId);
      if (isStillAvailable) return prevId;
      return availablePrizes.length > 0 ? availablePrizes[0].id : '';
    });

    setEligibleCount(eligible);
    setWinners(getStoredVouchers().filter((x) => x.status === 'menang'));
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

  const handleStartDraw = async () => {
    if (isRolling || resolvingRef.current || !selectedPrizeId) return;
    resolvingRef.current = true;
    setErrorMsg('');
    setCandidateVoucher(null);
    setIsConfirmedWinner(false);
    setLastPoolSize(null);

    try {
      // Ambil daftar kode kupon SAH dari server (pool). Pemenang BELUM
      // ditentukan — kode yang membeku saat MC menekan Stop itulah pemenang.
      const res = await fetch('/api/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prizeId: selectedPrizeId }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        const rawErr = data.error || 'Gagal memuat kumpulan kupon undian.';
        const errStr = typeof rawErr === 'string' ? rawErr : (rawErr.message || String(rawErr));
        setErrorMsg(errStr);
        return;
      }

      const codes: string[] = data.codes;
      if (!Array.isArray(codes) || codes.length === 0) {
        setErrorMsg('Tidak ada kupon sah tersisa untuk diundi.');
        return;
      }

      poolCodesRef.current = shuffleCodes(codes);
      poolIdxRef.current = 0;
      currentDisplayCodeRef.current = poolCodesRef.current[0];
      setDisplayDigits(poolCodesRef.current[0]);

      if (typeof data.audit?.pool_size === 'number') {
        setLastPoolSize(data.audit.pool_size);
      }

      setIsRolling(true);

      // Putar KODE KUPON ASLI dengan cepat. Kode yang membeku saat Stop
      // dikirim ke /api/draw/stop untuk diverifikasi & dicatat — tidak ada
      // lagi angka acak yang "berganti" setelah berhenti.
      rollIntervalRef.current = window.setInterval(() => {
        const code = poolCodesRef.current[poolIdxRef.current % poolCodesRef.current.length];
        poolIdxRef.current += 1;
        currentDisplayCodeRef.current = code;
        setDisplayDigits(code);
        soundManager.playTick();
      }, 85);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Draw start error message:', msg);
      setErrorMsg(msg || 'Gagal terhubung ke server pengundian.');
    } finally {
      soundManager.stopDrumroll();
      resolvingRef.current = false;
    }
  };

  const stopRoll = async () => {
    if (!isRolling || resolvingRef.current) return;
    resolvingRef.current = true;
    setErrorMsg('');

    // Kode yang tampil saat Stop membeku dan dikirim ke server untuk
    // diverifikasi & dicatat — layar tidak pernah melihat angka "beku lalu
    // berganti" lagi.
    if (rollIntervalRef.current !== null) {
      clearInterval(rollIntervalRef.current);
      rollIntervalRef.current = null;
    }
    soundManager.stopDrumroll();

    const frozenCode = currentDisplayCodeRef.current;

    try {
      const res = await fetch('/api/draw/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prizeId: selectedPrizeId, code: frozenCode }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        const rawErr = data.error || 'Gagal memverifikasi undian.';
        const errStr = typeof rawErr === 'string' ? rawErr : (rawErr.message || String(rawErr));
        setErrorMsg(errStr);
        return;
      }

      const candidate: Voucher = data.candidate;
      candidateRef.current = candidate;
      setDisplayDigits(candidate.code);
      setCandidateVoucher(candidate);

      soundManager.playVictoryFanfare();
      triggerConfetti();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Draw stop error message:', msg);
      setErrorMsg(msg || 'Gagal terhubung ke server pengundian.');
    } finally {
      setIsRolling(false);
      resolvingRef.current = false;
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

  const handleForfeitAndRedraw = async () => {
    if (!candidateVoucher || isConfirming || resolvingRef.current) return;
    resolvingRef.current = true;
    setErrorMsg('');
    const forfeitedCode = candidateVoucher.code;
    setCandidateVoucher(null);
    setIsConfirmedWinner(false);

    let ok = false;
    try {
      const res = await fetch('/api/draw/forfeit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prizeId: selectedPrizeId, code: forfeitedCode }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        const rawErr = data.error || 'Gagal menggugurkan kandidat.';
        const errStr = typeof rawErr === 'string' ? rawErr : (rawErr.message || String(rawErr));
        setErrorMsg(errStr);
      } else {
        ok = true;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Draw forfeit error message:', msg);
      setErrorMsg(msg || 'Gagal terhubung ke server untuk menggugurkan.');
    } finally {
      resolvingRef.current = false;
    }

    if (ok) {
      await syncFromSupabase();
      refreshLocalData();
      void handleStartDraw();
    }
  };

  // Kontrol undian dengan keyboard: Spasi untuk memulai/berhenti/undi
  // berikutnya; Y = konfirmasi pemenang, N = gugurkan & undi ulang.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'y' || e.key === 'Y') {
        if (candidateVoucher && !isConfirmedWinner && !isConfirming) {
          e.preventDefault();
          handleConfirmWinner();
        }
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        if (candidateVoucher && !isConfirmedWinner && !isConfirming) {
          e.preventDefault();
          handleForfeitAndRedraw();
        }
        return;
      }
      if (e.key !== ' ') return;
      e.preventDefault();
      if (isRolling) {
        stopRoll();
      } else if (!candidateVoucher && selectedPrizeId) {
        handleStartDraw();
      } else if (candidateVoucher && isConfirmedWinner) {
        handleStartDraw();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRolling, isConfirming, candidateVoucher, selectedPrizeId, isConfirmedWinner]);

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
    <div className="space-y-8 py-4 max-w-7xl mx-auto">
      {/* Top Controls Bar */}
      <UndianHeader
        eligibleCount={eligibleCount}
        poolSize={lastPoolSize}
        onToggleFullscreen={toggleFullscreen}
      />

      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)_240px] lg:items-start lg:gap-6">
        <aside className="lg:sticky lg:top-16 @container">
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
        </aside>

        {/* BIG STAGE SCREEN (PROYEKTOR MODE) */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-5 sm:p-8 text-center space-y-5 shadow-xl">
        {/* Selected Prize Badge */}
        {currentPrize && (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#E70013] text-white text-sm font-black uppercase tracking-widest shadow-lg">
              <Trophy className="w-5 h-5 text-white animate-bounce" />
              Kategori Hadiah: {currentPrize.name}
            </div>
            {currentPrize.donor_name && (
              <p className="text-xs font-bold text-violet-700">
                🎁 Hadiah dari: {currentPrize.donor_name}
              </p>
            )}
          </div>
        )}

        {/* 5-DIGIT DISPLAY SLOTS */}
        <DigitSlotsDisplay
          displayDigits={displayDigits}
          isRolling={isRolling}
          winnerVoucher={isConfirmedWinner ? candidateVoucher : null}
          ownerName={candidateVoucher?.customer_name ?? null}
        />

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
          onStopDraw={stopRoll}
          onConfirmWinner={handleConfirmWinner}
          onForfeitAndRedraw={handleForfeitAndRedraw}
        />
        </div>

        <aside className="lg:sticky lg:top-16">
          <WinnersPanel winners={winners} />
        </aside>
      </div>
    </div>
    </RequireAuth>
  );
}

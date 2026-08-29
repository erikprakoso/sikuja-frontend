'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { getStoredPrizes, getStoredVouchers, syncFromSupabase, SIKUJA_EVENT_NAME, sortPrizesByUnitPrice } from '@/lib/storage';
import { soundManager } from '@/lib/services/audio';
import { Prize, Voucher } from '@/types';
import { Trophy, AlertCircle, Maximize } from 'lucide-react';

import Link from 'next/link';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PrizeSelectorGrid } from '@/components/undian/PrizeSelectorGrid';
import { DigitSlotsDisplay } from '@/components/undian/DigitSlotsDisplay';
import { WinnersPanel } from '@/components/undian/WinnersPanel';
import { DrawControls } from '@/components/undian/DrawControls';

// Helper aman untuk menampilkan error API tanpa [object Object]
function formatApiError(raw: unknown, fallback: string): string {
  if (!raw) return fallback;
  if (typeof raw === 'string') return raw !== '[object Object]' ? raw : fallback;
  if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (typeof o.message === 'string' && o.message && o.message !== '[object Object]') return o.message;
    if (typeof o.error === 'string' && o.error && o.error !== '[object Object]') return o.error;
    if (typeof o.msg === 'string' && o.msg) return o.msg;
    try {
      const s = JSON.stringify(raw);
      if (s && s !== '{}' && s !== '""' && s !== '[object Object]') return s;
    } catch {}
  }
  const s = String(raw);
  return s && s !== '[object Object]' ? s : fallback;
}

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

export default function DrawPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>('');
  const [eligibleCount, setEligibleCount] = useState<number>(0);
  
  const [isRolling, setIsRolling] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
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

  const refreshLocalData = () => {
    const p = getStoredPrizes();
    setPrizes(p);

    const availablePrizes = sortPrizesByUnitPrice(p).filter((item) => item.drawn_count < item.stock);

    setSelectedPrizeId((prevId) => {
      const isStillAvailable = availablePrizes.some((item) => item.id === prevId);
      if (isStillAvailable) return prevId;
      return availablePrizes.length > 0 ? availablePrizes[0].id : '';
    });

    const v = getStoredVouchers();
    const eligible = v.filter((x) => x.status === 'checkin').length;
    setEligibleCount(eligible);
    setWinners(v.filter((x) => x.status === 'menang'));
  };

  useEffect(() => {
    syncFromSupabase().then(() => {
      refreshLocalData();
    });

    window.addEventListener(SIKUJA_EVENT_NAME, refreshLocalData);
    return () => {
      window.removeEventListener(SIKUJA_EVENT_NAME, refreshLocalData);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      void syncFromSupabase().then(() => refreshLocalData());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (rollIntervalRef.current !== null) clearInterval(rollIntervalRef.current);
      soundManager.stopDrumroll();
    };
  }, []);

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.65 },
      colors: ['#E70013', '#ffffff', '#ff4d5a'],
    });
    confetti({
      particleCount: 80,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.65 },
      colors: ['#E70013', '#ffffff', '#ff4d5a'],
    });
  };

  const handleStartDraw = async () => {
    if (isRolling || isStarting || resolvingRef.current || !selectedPrizeId) return;
    resolvingRef.current = true;
    setIsStarting(true);
    setErrorMsg('');
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
        setErrorMsg(formatApiError(data.error, 'Gagal memuat kumpulan kupon undian.'));
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

      // Bersihkan kandidat sebelumnya HANYA setelah pool siap — hindari kedipan Mulai setelah Undi Berikutnya
      setCandidateVoucher(null);
      setIsConfirmedWinner(false);
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
      const msg = err instanceof Error ? err.message : formatApiError(err, 'Gagal terhubung ke server pengundian.');
      console.error('Draw start error message:', msg, err);
      setErrorMsg(msg || 'Gagal terhubung ke server pengundian.');
    } finally {
      soundManager.stopDrumroll();
      resolvingRef.current = false;
      setIsStarting(false);
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
        setErrorMsg(formatApiError(data.error, 'Gagal memverifikasi undian.'));
        return;
      }

      const candidate: Voucher = data.candidate;
      candidateRef.current = candidate;
      setDisplayDigits(candidate.code);
      setCandidateVoucher(candidate);

      soundManager.playVictoryFanfare();
      triggerConfetti();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : formatApiError(err, 'Gagal terhubung ke server pengundian.');
      console.error('Draw stop error message:', msg, err);
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
        setErrorMsg(formatApiError(data.error, 'Gagal mengonfirmasi pemenang.'));
        setIsConfirming(false);
        return;
      }

      setIsConfirmedWinner(true);
      setIsConfirming(false);

      soundManager.playVictoryFanfare();
      triggerConfetti();

      await syncFromSupabase();
      refreshLocalData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : formatApiError(err, 'Gagal terhubung ke server untuk mengonfirmasi.');
      console.error('Confirm error message:', msg, err);
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
        setErrorMsg(formatApiError(data.error, 'Gagal menggugurkan kandidat.'));
      } else {
        ok = true;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : formatApiError(err, 'Gagal terhubung ke server untuk menggugurkan.');
      console.error('Draw forfeit error message:', msg, err);
      setErrorMsg(msg || 'Gagal terhubung ke server untuk menggugurkan.');
    } finally {
      resolvingRef.current = false;
    }

    if (ok) {
      await syncFromSupabase();
      refreshLocalData();
      // Jangan auto-start, biarkan operator tekan Spasi / Mulai Undian secara manual (konsisten dengan Konfirmasi -> Undi Berikutnya)
    }
  };

  // Kontrol undian dengan keyboard: Spasi untuk memulai/berhenti/undi
  // berikutnya; Y = konfirmasi pemenang, N = gugurkan & undi ulang.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isStarting) return;
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
  }, [isRolling, isStarting, isConfirming, candidateVoucher, selectedPrizeId, isConfirmedWinner]);

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
      <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col overflow-hidden">
        {/* Background premium - subtle glow, tetap hitam pekat outdoor */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_60%_at_50%_-15%,rgba(250,204,21,0.09),transparent_62%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_100%_100%,rgba(231,0,19,0.07),transparent_60%)]" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-400/25 to-transparent" />
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`, backgroundSize: '36px 36px' }} />
        </div>

        {/* Header profesional full-width */}
        <header className="relative shrink-0 h-[56px] sm:h-[64px] flex items-center justify-between gap-3 px-3 sm:px-6 border-b border-zinc-800 bg-zinc-900/75 backdrop-blur-xl">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/"
              className="shrink-0 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-[11px] sm:text-xs font-black tracking-wide transition-colors"
            >
              ← <span className="hidden sm:inline">Keluar Stage</span><span className="sm:hidden">Keluar</span>
            </Link>
            <div className="hidden sm:block h-6 w-px bg-zinc-700" />
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <img src="/logo-ri.png" alt="Logo" className="h-7 sm:h-9 w-auto shrink-0" />
              <div className="min-w-0 leading-none hidden xs:block">
                <div className="font-black text-white text-[13px] sm:text-[15px] tracking-tight truncate">
                  JALAN SEHAT <span className="text-[#E70013]">2026</span>
                </div>
                <div className="hidden sm:block text-[10px] font-black tracking-[0.16em] text-zinc-500 uppercase">Panggung Undian Doorprize</div>
              </div>
            </div>
            <span className="hidden lg:inline-flex items-center gap-1.5 ml-1 sm:ml-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.14em]">LIVE</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="hidden md:flex items-center gap-4 sm:gap-5">
              <div className="text-right">
                <div className="text-[10px] font-black tracking-[0.14em] text-zinc-500 uppercase leading-none">Peserta Sah</div>
                <div className="text-sm font-black font-mono text-white leading-none mt-1">{eligibleCount.toLocaleString('id-ID')}</div>
              </div>
              <div className="h-8 w-px bg-zinc-800" />
              <div className="text-right">
                <div className="text-[10px] font-black tracking-[0.14em] text-zinc-500 uppercase leading-none">Pool Terakhir</div>
                <div className="text-sm font-black font-mono text-yellow-400 leading-none mt-1">{lastPoolSize !== null ? lastPoolSize.toLocaleString('id-ID') : '—'}</div>
              </div>
              <div className="h-8 w-px bg-zinc-800 hidden xl:block" />
              <div className="hidden xl:block text-right">
                <div className="text-[10px] font-black tracking-[0.14em] text-zinc-500 uppercase leading-none">Pemenang</div>
                <div className="text-sm font-black font-mono text-white leading-none mt-1">{winners.length}</div>
              </div>
            </div>
            {/* Mobile stats compact */}
            <div className="flex md:hidden items-center gap-2 text-[11px] font-mono font-black">
              <span className="px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-white">{eligibleCount}</span>
              <span className="text-zinc-600">/</span>
              <span className="px-2 py-1 rounded-full bg-yellow-400 text-black">{winners.length}</span>
            </div>
            <button
              onClick={toggleFullscreen}
              className="shrink-0 p-2 sm:p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Mode Tampilan Penuh"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Stage full-page */}
        <div className="relative flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-[320px_minmax(0,1fr)_340px] gap-4 sm:gap-5 p-3 sm:p-5 lg:p-6 overflow-y-auto lg:overflow-hidden">
          {/* Left - Kategori */}
          <aside className="lg:min-h-0 lg:overflow-y-auto lg:pr-1 order-2 lg:order-1">
            <div className="rounded-2xl bg-zinc-900/60 backdrop-blur border border-zinc-800 p-4 shadow-xl">
              <PrizeSelectorGrid
                prizes={prizes}
                selectedPrizeId={selectedPrizeId}
                isRolling={isRolling || isStarting}
                onSelectPrize={(id) => {
                  setSelectedPrizeId(id);
                  setCandidateVoucher(null);
                  setIsConfirmedWinner(false);
                }}
              />
            </div>
          </aside>

          {/* Center - Panggung utama */}
          <div className="order-1 lg:order-2 flex flex-col justify-center gap-4 lg:min-h-0 lg:overflow-y-auto lg:py-2">
            <div className="relative rounded-[24px] sm:rounded-[32px] bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-900 border-[3px] border-yellow-400 p-4 sm:p-6 lg:p-8 text-center shadow-[0_0_0_1px_rgba(250,204,21,0.18),0_18px_60px_rgba(0,0,0,0.65),0_0_80px_rgba(250,204,21,0.10)] overflow-hidden">
              <div className="pointer-events-none absolute inset-0 rounded-[24px] sm:rounded-[32px] bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
              <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[85%] h-32 bg-yellow-400/10 blur-[50px] rounded-full" />

              {currentPrize && (
                <div className="relative flex justify-center mb-4 sm:mb-6">
                  <div className="inline-flex items-center gap-2 px-5 sm:px-7 py-2 sm:py-2.5 rounded-full bg-[#E70013] text-white text-xs sm:text-sm font-black uppercase tracking-widest shadow-lg border border-white/20">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 animate-bounce" />
                    <span className="truncate max-w-[22ch] sm:max-w-none">{currentPrize.name}</span>
                  </div>
                </div>
              )}

              <div className="relative">
                <DigitSlotsDisplay
                  displayDigits={displayDigits}
                  isRolling={isRolling}
                  winnerVoucher={isConfirmedWinner ? candidateVoucher : null}
                  ownerName={candidateVoucher?.customer_name ?? null}
                />
              </div>

              {errorMsg && (
                <div className="relative mt-4 flex justify-center">
                  <div className="p-3 sm:p-4 rounded-2xl bg-[#E70013] text-white text-sm font-black inline-flex items-center gap-2 border-2 border-white/20 max-w-md shadow-lg">
                    <AlertCircle className="w-5 h-5 shrink-0 text-white" />
                    <span className="text-left leading-tight">{errorMsg}</span>
                  </div>
                </div>
              )}

              <div className="relative mt-6 sm:mt-8 flex justify-center">
                <div className="w-full max-w-xl">
                  <DrawControls
                    isRolling={isRolling}
                    isStarting={isStarting}
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
              </div>

            </div>

          </div>

          {/* Right - Pemenang */}
          <aside className="lg:min-h-0 lg:overflow-hidden flex flex-col order-3">
            <div className="rounded-2xl bg-zinc-900/60 backdrop-blur border border-zinc-800 p-4 shadow-xl flex-1 min-h-0 flex flex-col">
              <WinnersPanel winners={winners} />
            </div>
          </aside>
        </div>

        {/* Footer */}
        <div className="relative shrink-0 hidden sm:flex items-center justify-between px-6 py-2.5 border-t border-zinc-800/80 bg-zinc-900/40 backdrop-blur text-[11px]">
          <span className="font-semibold text-zinc-500">Jalan Sehat 2026</span>
          <span className="font-mono text-zinc-600">{winners.length} pemenang • {eligibleCount} peserta</span>
        </div>
      </div>
    </RequireAuth>
  );
}

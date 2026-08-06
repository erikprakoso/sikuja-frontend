'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  checkInVoucher,
  checkInTransactionBatch,
  searchTransactions,
  TransactionMatch,
} from '@/lib/services/voucher';
import { playSuccessFeedback, playErrorFeedback } from '@/lib/services/feedback';
import { getStoredVouchers, getOfflineQueue, saveOfflineQueue, syncFromSupabase, SIKUJA_EVENT_NAME } from '@/lib/storage';
import { PosCheckin } from '@/types';
import { CheckCircle2, AlertCircle } from 'lucide-react';

import { RequireAuth } from '@/components/auth/RequireAuth';
import { CheckinHeader } from '@/components/checkin/CheckinHeader';
import { OfflineQueueBanner } from '@/components/checkin/OfflineQueueBanner';
import { CheckinSearch } from '@/components/checkin/CheckinSearch';
import { CheckinScanner } from '@/components/checkin/CheckinScanner';
import { CheckinOperatorTips } from '@/components/checkin/CheckinOperatorTips';

export default function CheckinPosPage() {
  const [resultMessage, setResultMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [resultKey, setResultKey] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<PosCheckin[]>([]);
  const [totalCheckinCount, setTotalCheckinCount] = useState(0);
  const [totalVoucherCount, setTotalVoucherCount] = useState(0);

  // Alur pencarian pembeli → pilih transaksi → verifikasi.
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const matches = searchTransactions(searchQuery);
  const selectedMatch: TransactionMatch | null = selectedTxId
    ? matches.find((m) => m.tx.id === selectedTxId) ?? null
    : null;
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader-pos';
  const autoClearTimerRef = useRef<number | null>(null);

  // Guard untuk mode pemindaian kontinu (banyak peserta):
  // - jangan proses frame baru selama masih memproses kode sebelumnya
  // - abaikan kode yang sama dalam 2,5 detik (mencegah trigger ganda QR yang sama)
  const processingRef = useRef(false);
  const lastCodeRef = useRef('');
  const lastCodeTimeRef = useRef(0);

  const refreshStats = () => {
    const v = getStoredVouchers();
    setTotalVoucherCount(v.length);
    setTotalCheckinCount(v.filter((x) => x.status !== 'terbit').length);
    setOfflineQueue(getOfflineQueue());
  };

  useEffect(() => {
    syncFromSupabase().then(() => refreshStats());
    window.addEventListener(SIKUJA_EVENT_NAME, refreshStats);
    return () => {
      window.removeEventListener(SIKUJA_EVENT_NAME, refreshStats);
    };
  }, []);

  // Bersih-bersih saat keluar halaman: stop kamera + batalkan timer auto-clear.
  useEffect(() => {
    return () => {
      if (autoClearTimerRef.current !== null) clearTimeout(autoClearTimerRef.current);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Pesan sukses otomatis hilang setelah 3,5 dtk agar siap untuk scan berikutnya.
  const scheduleAutoClearSuccess = () => {
    if (autoClearTimerRef.current !== null) clearTimeout(autoClearTimerRef.current);
    autoClearTimerRef.current = window.setTimeout(() => {
      setResultMessage((prev) => (prev && prev.success ? null : prev));
      autoClearTimerRef.current = null;
    }, 3500);
  };

  const handleProcessCode = async (scannedText: string) => {
    const raw = scannedText.trim();
    if (!raw) return;

    // Jalur scan/QR independen dari alur pencarian.
    setSelectedTxId(null);

    await processSingleEntry(raw);
  };

  const processSingleEntry = async (raw: string) => {
    setIsProcessing(true);
    setResultMessage(null);

    try {
      // Extract token if scanned text is full URL (/v/...)
      let token = raw;
      if (raw.includes('/v/')) {
        token = raw.split('/v/')[1].split('?')[0].split('#')[0];
      }

      let feedback: { success: boolean; text: string } | null = null;

      // Call API /api/checkin first (which checks Supabase)
      try {
        const res = await fetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codeOrToken: token }),
        });
        const data = await res.json();

        if (res.ok && data.success) {
          feedback = { success: true, text: data.message };
        } else if (data.error) {
          feedback = { success: false, text: data.error };
        }
      } catch (err) {
        console.warn('API /checkin unreachable, attempting offline local storage fallback...', err);
      }

      // Fallback to offline local storage if network is offline
      if (!feedback) {
        const batchRes = checkInTransactionBatch(token);
        if (batchRes.success && batchRes.count > 0) {
          feedback = { success: true, text: batchRes.message };
        } else {
          const singleRes = checkInVoucher(token);
          feedback = { success: singleRes.success, text: singleRes.message };
        }
      }

      setResultMessage(feedback);
      setResultKey((k) => k + 1);
      refreshStats();

      if (feedback.success) {
        playSuccessFeedback();
        scheduleAutoClearSuccess();
      } else {
        playErrorFeedback();
      }
    } finally {
      // Pastikan UI & kamera selalu kembali siap walau ada error tak terduga.
      setIsProcessing(false);
    }
  };

  // Verifikasi transaksi yang dipilih dari hasil pencarian (HANYA transaksi tsb,
  // bukan seluruh transaksi dengan no. HP / nama yang sama).
  const handleVerifySelected = async () => {
    if (!selectedTxId) return;
    setIsProcessing(true);
    setResultMessage(null);

    try {
      let feedback: { success: boolean; text: string } | null = null;

      try {
        const res = await fetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionId: selectedTxId }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          feedback = { success: true, text: data.message };
        } else if (data.error) {
          feedback = { success: false, text: data.error };
        }
      } catch (err) {
        console.warn('API /checkin unreachable for selected transaction, offline fallback...', err);
      }

      if (!feedback) {
        const batchRes = checkInTransactionBatch(selectedTxId, 'pos-device-1', { exact: true });
        feedback = { success: batchRes.success, text: batchRes.message };
      }

      setResultMessage(feedback);
      setResultKey((k) => k + 1);
      refreshStats();

      if (feedback.success) {
        playSuccessFeedback();
        scheduleAutoClearSuccess();
      } else {
        playErrorFeedback();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const startCamera = async () => {
    try {
      setIsScanning(true);
      setResultMessage(null);

      // Wait a tick to ensure DOM element is displayed
      await new Promise((r) => setTimeout(r, 100));

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerContainerId);
      }

      const qrConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      };
      const onScanSuccess = (decodedText: string) => {
        // Mode kontinu: kamera tetap menyala, cukup guard anti-trigger ganda.
        const now = Date.now();
        if (processingRef.current) return;
        if (decodedText === lastCodeRef.current && now - lastCodeTimeRef.current < 2500) return;
        processingRef.current = true;
        lastCodeRef.current = decodedText;
        lastCodeTimeRef.current = now;
        void handleProcessCode(decodedText).finally(() => {
          processingRef.current = false;
        });
      };

      try {
        await scannerRef.current.start(
          { facingMode: 'environment' },
          qrConfig,
          onScanSuccess,
          () => {}
        );
      } catch (primaryErr) {
        console.warn('FacingMode environment failed, attempting camera list fallback...', primaryErr);
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          const backCam =
            devices.find(
              (d) =>
                d.label.toLowerCase().includes('back') ||
                d.label.toLowerCase().includes('rear') ||
                d.label.toLowerCase().includes('belakang')
            ) || devices[0];

          await scannerRef.current.start(backCam.id, qrConfig, onScanSuccess, () => {});
        } else {
          throw primaryErr;
        }
      }
    } catch (err: unknown) {
      console.error('Camera start error:', err);
      setIsScanning(false);

      const message = err instanceof Error ? err.message : '';
      setResultMessage({
        success: false,
        text: `Gagal mengakses kamera perangkat: ${message || 'Pastikan izin akses kamera diizinkan pada browser Anda.'}`,
      });
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
    }
    setIsScanning(false);
  };

  const handleSyncOffline = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    setIsProcessing(true);
    setResultMessage(null);

    let synced = 0;
    let failed = 0;
    const syncedIds = new Set<string>();

    // Benar-benar kirim ke server; hanya hapus dari antrean yang server sudah catat.
    for (const item of queue) {
      try {
        const res = await fetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codeOrToken: item.voucher_code }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          synced++;
          syncedIds.add(item.id);
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    if (syncedIds.size > 0) {
      saveOfflineQueue(getOfflineQueue().filter((q) => !syncedIds.has(q.id)));
    }

    refreshStats();
    setIsProcessing(false);

    setResultMessage(
      failed > 0
        ? { success: false, text: `Sinkron ${synced} data berhasil, ${failed} gagal (tetap tersimpan & siap dicoba lagi).` }
        : { success: true, text: `Berhasil menyinkronkan ${synced} data validasi offline ke server.` }
    );
  };

  // Auto-sync berkala: tarik data terbaru dari server dan dorong antrean offline
  // yang menunggu, agar cache lokal setiap HP petugas selalu segar.
  useEffect(() => {
    const interval = setInterval(() => {
      void syncFromSupabase().then(() => refreshStats());
      // Jangan dorong antrean bersamaan dengan scan yang sedang berjalan
      // agar result message / isProcessing tidak saling menimpa.
      if (!processingRef.current && getOfflineQueue().length > 0) {
        processingRef.current = true;
        void handleSyncOffline().finally(() => {
          processingRef.current = false;
        });
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <RequireAuth roles={['pos', 'admin']}>
    <div className="max-w-2xl mx-auto space-y-4 py-4">
      {/* Header Banner */}
      <CheckinHeader
        totalCheckinCount={totalCheckinCount}
        totalVoucherCount={totalVoucherCount}
      />

      {/* Offline Queue Notice */}
      <OfflineQueueBanner
        queueCount={offlineQueue.length}
        onSync={handleSyncOffline}
      />

      {/* Pencarian Pembeli (prioritas utama) */}
      <CheckinSearch
        query={searchQuery}
        setQuery={(q) => {
          setSearchQuery(q);
          setSelectedTxId(null);
        }}
        matches={matches}
        selected={selectedMatch}
        isProcessing={isProcessing}
        onSelect={(m) => setSelectedTxId(m.tx.id)}
        onBack={() => setSelectedTxId(null)}
        onVerify={handleVerifySelected}
      />

      {/* Result Alert Box (dipakai jalur pencarian & scan) */}
      {!isProcessing && resultMessage && (
        <div
          key={resultKey}
          role="status"
          aria-live="polite"
          className={`p-4 rounded-2xl border text-sm font-bold flex items-start gap-3 animate-fade-in ${
            resultMessage.success
              ? 'bg-emerald-900 text-white border-emerald-900 shadow-md'
              : 'bg-red-50 border-red-200 text-red-700 shadow-xs'
          }`}
        >
          {resultMessage.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-bold">{resultMessage.text}</p>
          </div>
        </div>
      )}

      {/* Scanner & Kode Manual (sekunder) */}
      <CheckinScanner
        scannerContainerId={scannerContainerId}
        isScanning={isScanning}
        isProcessing={isProcessing}
        onStartCamera={startCamera}
        onStopCamera={stopCamera}
      />

      {/* POS Operator Tips */}
      <CheckinOperatorTips />
    </div>
    </RequireAuth>
  );
}

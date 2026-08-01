'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { checkInVoucher, checkInTransactionBatch } from '@/lib/services/voucher';
import { getStoredVouchers, getOfflineQueue, saveOfflineQueue, syncFromSupabase, SIKUJA_EVENT_NAME } from '@/lib/storage';
import { PosCheckin } from '@/types';

import { RequireAuth } from '@/components/auth/RequireAuth';
import { CheckinHeader } from '@/components/checkin/CheckinHeader';
import { OfflineQueueBanner } from '@/components/checkin/OfflineQueueBanner';
import { CheckinScanner } from '@/components/checkin/CheckinScanner';
import { CheckinOperatorTips } from '@/components/checkin/CheckinOperatorTips';

export default function CheckinPosPage() {
  const [inputCode, setInputCode] = useState('');
  const [resultMessage, setResultMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<PosCheckin[]>([]);
  const [totalCheckinCount, setTotalCheckinCount] = useState(0);
  const [totalVoucherCount, setTotalVoucherCount] = useState(0);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader-pos';

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

  const handleProcessCode = async (scannedText: string) => {
    const raw = scannedText.trim();
    if (!raw) return;

    setIsProcessing(true);
    setResultMessage(null);

    // Extract token if scanned text is full URL (/v/...)
    let token = raw;
    if (raw.includes('/v/')) {
      token = raw.split('/v/')[1].split('?')[0].split('#')[0];
    }

    // Call API /api/checkin first (which checks Supabase)
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeOrToken: token }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setResultMessage({
          success: true,
          text: data.message,
        });
        setInputCode('');
        refreshStats();
        setIsProcessing(false);
        return;
      } else if (data.error) {
        setResultMessage({
          success: false,
          text: data.error,
        });
        setInputCode('');
        refreshStats();
        setIsProcessing(false);
        return;
      }
    } catch (err) {
      console.warn('API /checkin unreachable, attempting offline local storage fallback...', err);
    }

    // Fallback to offline local storage if network is offline
    const batchRes = checkInTransactionBatch(token);
    if (batchRes.success && batchRes.count > 0) {
      setResultMessage({
        success: true,
        text: batchRes.message,
      });
      setInputCode('');
      refreshStats();
      setIsProcessing(false);
      return;
    }

    const singleRes = checkInVoucher(token);
    setResultMessage({
      success: singleRes.success,
      text: singleRes.message,
    });
    setInputCode('');
    refreshStats();
    setIsProcessing(false);
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

      const qrConfig = { fps: 10, qrbox: { width: 250, height: 250 } };
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
      if (getOfflineQueue().length > 0) {
        void handleSyncOffline();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <RequireAuth roles={['pos', 'admin']}>
    <div className="max-w-2xl mx-auto space-y-6 py-4">
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

      {/* Scanner & Code Input Box */}
      <CheckinScanner
        scannerContainerId={scannerContainerId}
        isScanning={isScanning}
        isProcessing={isProcessing}
        inputCode={inputCode}
        setInputCode={setInputCode}
        resultMessage={resultMessage}
        onStartCamera={startCamera}
        onStopCamera={stopCamera}
        onSubmitCode={handleProcessCode}
      />

      {/* POS Operator Tips */}
      <CheckinOperatorTips />
    </div>
    </RequireAuth>
  );
}

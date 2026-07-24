'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { checkInVoucher, checkInTransactionBatch } from '@/lib/services/voucher';
import { getStoredVouchers, getOfflineQueue, clearOfflineQueue, syncFromSupabase, SIVOJA_EVENT_NAME } from '@/lib/storage';
import { PosCheckin } from '@/types';

import { CheckinHeader } from '@/components/checkin/CheckinHeader';
import { OfflineQueueBanner } from '@/components/checkin/OfflineQueueBanner';
import { CheckinScanner } from '@/components/checkin/CheckinScanner';
import { CheckinOperatorTips } from '@/components/checkin/CheckinOperatorTips';

export default function CheckinPosPage() {
  const [inputCode, setInputCode] = useState('');
  const [resultMessage, setResultMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<PosCheckin[]>([]);
  const [totalCheckinCount, setTotalCheckinCount] = useState(0);
  const [totalVoucherCount, setTotalVoucherCount] = useState(0);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader-pos';

  const loadStats = async () => {
    await syncFromSupabase();
    const v = getStoredVouchers();
    setTotalVoucherCount(v.length);
    setTotalCheckinCount(v.filter((x) => x.status !== 'terbit').length);
    setOfflineQueue(getOfflineQueue());
  };

  useEffect(() => {
    loadStats();
    if (typeof window !== 'undefined') {
      window.addEventListener(SIVOJA_EVENT_NAME, loadStats);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(SIVOJA_EVENT_NAME, loadStats);
      }
    };
  }, []);

  const handleProcessCode = async (scannedText: string) => {
    const raw = scannedText.trim();
    if (!raw) return;

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
        await loadStats();
        return;
      } else if (data.error) {
        setResultMessage({
          success: false,
          text: data.error,
        });
        setInputCode('');
        await loadStats();
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
      await loadStats();
      return;
    }

    const singleRes = checkInVoucher(token);
    setResultMessage({
      success: singleRes.success,
      text: singleRes.message,
    });
    setInputCode('');
    await loadStats();
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
        handleProcessCode(decodedText);
        stopCamera();
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
    } catch (err: any) {
      console.error('Camera start error:', err);
      setIsScanning(false);

      const isHttpIp =
        typeof window !== 'undefined' &&
        window.location.protocol === 'http:' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1';

      setResultMessage({
        success: false,
        text: isHttpIp
          ? '🔒 Kamera diblokir browser karena diakses via HTTP IP (bukan HTTPS). Gunakan localhost / HTTPS / ngrok, atau aktifkan chrome://flags/#unsafely-treat-insecure-origin-as-secure.'
          : `Gagal membuka kamera HP: ${err?.message || 'Pastikan izin akses kamera diizinkan pada browser HP Anda.'}`,
      });
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
    }
    setIsScanning(false);
  };

  const handleSyncOffline = () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    queue.forEach((q) => {
      checkInVoucher(q.voucher_code);
    });
    clearOfflineQueue();
    loadStats();
    setResultMessage({
      success: true,
      text: `Berhasil menyinkronkan ${queue.length} scan antrean offline ke database!`,
    });
  };

  return (
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
  );
}

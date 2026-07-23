'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { checkInVoucher, checkInTransactionBatch } from '@/lib/services/voucher';
import { getStoredVouchers, getStoredTransactions, getOfflineQueue, clearOfflineQueue, SIVOJA_EVENT_NAME } from '@/lib/storage';
import { Voucher, Transaction, PosCheckin } from '@/types';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Camera,
  Layers,
  RefreshCw,
  Search,
  Wifi,
  WifiOff,
  Zap,
  Sparkles,
} from 'lucide-react';

export default function CheckinPosPage() {
  const [inputCode, setInputCode] = useState('');
  const [resultMessage, setResultMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<PosCheckin[]>([]);
  const [totalCheckinCount, setTotalCheckinCount] = useState(0);
  const [totalVoucherCount, setTotalVoucherCount] = useState(0);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader-pos';

  const loadStats = () => {
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

  const handleProcessCode = (scannedText: string) => {
    const raw = scannedText.trim();
    if (!raw) return;

    // Check if scanned URL is a transaction token (e.g. contains /v/tx_...)
    let token = raw;
    if (raw.includes('/v/')) {
      token = raw.split('/v/')[1].split('?')[0].split('#')[0];
    }

    // Try batch check-in first if it matches a transaction token
    const batchRes = checkInTransactionBatch(token);
    if (batchRes.success && batchRes.count > 0) {
      setResultMessage({
        success: true,
        text: batchRes.message,
      });
      setInputCode('');
      loadStats();
      return;
    }

    // Otherwise try single 5-digit voucher check-in
    const singleRes = checkInVoucher(token);
    setResultMessage({
      success: singleRes.success,
      text: singleRes.message,
    });
    setInputCode('');
    loadStats();
  };

  const startCamera = async () => {
    try {
      setIsScanning(true);
      setResultMessage(null);
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerContainerId);
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleProcessCode(decodedText);
          stopCamera();
        },
        () => {}
      );
    } catch (err) {
      console.error('Camera start error:', err);
      setIsScanning(false);
      setResultMessage({
        success: false,
        text: 'Gagal membuka kamera HP. Pastikan izin kamera sudah diaktifkan di browser.',
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <QrCode className="w-3.5 h-3.5" />
            Pos Check-In Tengah Rute
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Multi-Scanner Validation</h1>
          <p className="text-xs text-slate-400">
            Scan 1 QR Transaksi untuk Batch Check-in atau scan 5-digit voucher fisik.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center sm:text-right">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Progres Check-In</span>
          <p className="text-xl font-black text-emerald-400 font-mono">
            {totalCheckinCount} <span className="text-xs font-normal text-slate-400">/ {totalVoucherCount}</span>
          </p>
        </div>
      </div>

      {/* Offline Queue Notice */}
      {offlineQueue.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-700/80 text-amber-200 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <WifiOff className="w-5 h-5 text-amber-400 animate-pulse flex-shrink-0" />
            <div>
              <p className="font-bold">Ada {offlineQueue.length} data scan tersimpan offline!</p>
              <p className="text-[11px] text-amber-300/80">
                Data akan tersimpan di HP ini sampai jaringan terhubung kembali.
              </p>
            </div>
          </div>
          <button
            onClick={handleSyncOffline}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md flex items-center gap-1 flex-shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Now
          </button>
        </div>
      )}

      {/* Scanner & Code Input Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Camera Feed Container */}
        <div className="space-y-4">
          <div
            id={scannerContainerId}
            className={`w-full overflow-hidden rounded-2xl border-2 ${
              isScanning ? 'border-emerald-500 bg-black min-h-[300px]' : 'hidden'
            }`}
          />

          {!isScanning ? (
            <button
              onClick={startCamera}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-lg shadow-xl shadow-emerald-950/60 transition-all flex items-center justify-center gap-3"
            >
              <Camera className="w-6 h-6" />
              Buka Kamera HP & Scan QR
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700"
            >
              Tutup Kamera
            </button>
          )}
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-xs text-slate-500 uppercase font-bold absolute">
            Atau Input Manual
          </span>
        </div>

        {/* Manual Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleProcessCode(inputCode);
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            placeholder="Ketik 5-digit kode atau token transaksi..."
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            className="flex-1 px-4 py-3.5 bg-slate-950 border border-slate-700 rounded-2xl text-white font-mono text-base placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!inputCode.trim()}
            className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Check-In
          </button>
        </form>

        {/* Result Alert Box */}
        {resultMessage && (
          <div
            className={`p-4 rounded-2xl border text-sm font-semibold flex items-start gap-3 animate-fade-in ${
              resultMessage.success
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
                : 'bg-red-950/80 border-red-800 text-red-200'
            }`}
          >
            {resultMessage.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{resultMessage.text}</p>
            </div>
          </div>
        )}
      </div>

      {/* POS Operator Tips */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
        <span className="font-bold text-slate-200 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-emerald-400" />
          Tips Panitia Pos:
        </span>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
          <li>1 transaksi e-voucher cukup discan 1x untuk langsung mengaktifkan semua kuponnya sekaligus.</li>
          <li>Beberapa panitia dapat membuka halaman ini bersamaan di HP masing-time tanpa risiko scan ganda.</li>
          <li>Data tersinkronkan real-time. Kode yang belum check-in tidak akan ditarik saat undian.</li>
        </ul>
      </div>
    </div>
  );
}

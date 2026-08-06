import React from 'react';
import { QrCode, Camera } from 'lucide-react';

interface CheckinScannerProps {
  scannerContainerId: string;
  isScanning: boolean;
  isProcessing?: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
}

export const CheckinScanner: React.FC<CheckinScannerProps> = ({
  scannerContainerId,
  isScanning,
  isProcessing = false,
  onStartCamera,
  onStopCamera,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
      {/* Section Label */}
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
        <QrCode className="w-4 h-4 text-[#E70013]" />
        Pindai QR Code E-Voucher
      </div>

      {/* Camera Toggle */}
      {isScanning ? (
        <button
          onClick={onStopCamera}
          disabled={isProcessing}
          className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-sm border border-slate-200 transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Camera className="w-4 h-4" /> Nonaktifkan Kamera
        </button>
      ) : (
        <button
          onClick={onStartCamera}
          disabled={isProcessing}
          className="w-full py-3 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:text-[#E70013] hover:border-[#E70013]/40 font-bold text-sm transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Camera className="w-4 h-4" /> Nyalakan Kamera & Pindai QR
        </button>
      )}

      {/* Camera Feed */}
      {isScanning && (
        <div
          id={scannerContainerId}
          className="w-full overflow-hidden rounded-xl border border-slate-300 bg-black min-h-[240px]"
        />
      )}
    </div>
  );
};

import React from 'react';
import { QrCode } from 'lucide-react';

interface CheckinHeaderProps {
  totalCheckinCount: number;
  totalVoucherCount: number;
}

export const CheckinHeader: React.FC<CheckinHeaderProps> = ({
  totalCheckinCount,
  totalVoucherCount,
}) => {
  return (
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
  );
};

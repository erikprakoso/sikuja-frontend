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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E70013] text-white text-xs font-bold uppercase tracking-wider mb-2">
          <QrCode className="w-3.5 h-3.5" />
          Pos Validasi Check-In
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Pemindaian & Validasi Kupon</h1>
        <p className="text-xs text-slate-600 font-medium mt-0.5">
          Pindai QR Code E-Voucher atau masukkan 5-digit kode kupon fisik untuk konfirmasi kehadiran.
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center sm:text-right shadow-xs">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Terverifikasi</span>
        <p className="text-xl font-black text-slate-900 font-mono mt-0.5">
          <span className="text-[#E70013]">{totalCheckinCount}</span> <span className="text-xs font-bold text-slate-500">/ {totalVoucherCount} Kupon</span>
        </p>
      </div>
    </div>
  );
};

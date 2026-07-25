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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-4 border-[#E70013]">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E70013] text-white text-xs font-black uppercase tracking-wider mb-2">
          <QrCode className="w-3.5 h-3.5" />
          Pos Validasi Check-In
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#E70013]">Pemindaian & Validasi Kupon</h1>
        <p className="text-xs text-[#E70013] font-bold">
          Pindai QR Code E-Voucher atau masukkan 5-digit kode kupon fisik untuk konfirmasi kehadiran.
        </p>
      </div>

      <div className="bg-white border-4 border-[#E70013] rounded-2xl p-3 text-center sm:text-right shadow-sm">
        <span className="text-[10px] text-[#E70013] font-black uppercase">Total Terverifikasi</span>
        <p className="text-xl font-black text-[#E70013] font-mono">
          {totalCheckinCount} <span className="text-xs font-bold text-[#E70013]">/ {totalVoucherCount}</span>
        </p>
      </div>
    </div>
  );
};

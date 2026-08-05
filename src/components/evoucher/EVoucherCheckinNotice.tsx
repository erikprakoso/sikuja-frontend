import React from 'react';

interface EVoucherCheckinNoticeProps {
  totalVouchers: number;
  checkinCount: number;
}

export const EVoucherCheckinNotice: React.FC<EVoucherCheckinNoticeProps> = ({
  totalVouchers,
  checkinCount,
}) => {
  if (totalVouchers > 0 && checkinCount >= totalVouchers) {
    return null;
  }

  return (
    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs space-y-0.5 font-medium shadow-xs">
      <p className="font-bold flex items-center gap-1.5 text-slate-900">
        📍 Petunjuk Verifikasi Peserta:
      </p>
      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
        Tunjukkan halaman ini kepada petugas di pos pemeriksaan untuk verifikasi {totalVouchers} kupon milik Anda.
      </p>
    </div>
  );
};

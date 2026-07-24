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
    <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs space-y-1">
      <p className="font-bold flex items-center gap-1.5">
        📍 Petunjuk Verifikasi Peserta:
      </p>
      <p className="text-[11px] text-amber-300/80 leading-relaxed">
        Tunjukkan halaman ini kepada petugas di pos pemeriksaan untuk verifikasi {totalVouchers} kupon milik Anda.
      </p>
    </div>
  );
};

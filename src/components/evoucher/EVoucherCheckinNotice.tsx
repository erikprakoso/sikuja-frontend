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
    <div className="p-4 rounded-2xl bg-[#E70013]/5 border border-[#E70013]/15 text-[#E70013] text-xs space-y-1 font-semibold shadow-xs">
      <p className="font-bold flex items-center gap-1.5">
        📍 Petunjuk Verifikasi Peserta:
      </p>
      <p className="text-[11px] text-[#E70013]/80 font-medium leading-relaxed">
        Tunjukkan halaman ini kepada petugas di pos pemeriksaan untuk verifikasi {totalVouchers} kupon milik Anda.
      </p>
    </div>
  );
};

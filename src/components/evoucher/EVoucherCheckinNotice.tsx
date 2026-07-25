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
    <div className="p-4 rounded-2xl bg-white border-4 border-[#E70013] text-[#E70013] text-xs space-y-1 font-bold shadow-md">
      <p className="font-black flex items-center gap-1.5">
        📍 Petunjuk Verifikasi Peserta:
      </p>
      <p className="text-[11px] font-bold leading-relaxed">
        Tunjukkan halaman ini kepada petugas di pos pemeriksaan untuk verifikasi {totalVouchers} kupon milik Anda.
      </p>
    </div>
  );
};

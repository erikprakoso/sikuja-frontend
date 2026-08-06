import React from 'react';

interface CheckinHeaderProps {
  totalCheckinCount: number;
  totalVoucherCount: number;
}

export const CheckinHeader: React.FC<CheckinHeaderProps> = ({
  totalCheckinCount,
  totalVoucherCount,
}) => {
  return (
    <p className="text-sm font-bold text-slate-600 text-right pb-1.5 border-b border-slate-200">
      <span className="text-[#E70013]">{totalCheckinCount}</span>
      <span className="text-slate-400"> / {totalVoucherCount} kupon terverifikasi</span>
    </p>
  );
};

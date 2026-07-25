import React from 'react';
import { Voucher } from '@/types';
import { CheckCircle2, Clock } from 'lucide-react';

interface WinnerBannerProps {
  voucher: Voucher;
  isConfirmed: boolean;
}

export const WinnerBanner: React.FC<WinnerBannerProps> = ({ voucher, isConfirmed }) => {
  if (isConfirmed) {
    return (
      <div className="p-6 sm:p-8 rounded-3xl bg-[#E70013] border-4 border-[#E70013] text-white max-w-xl mx-auto space-y-3 shadow-2xl">
        <div className="flex items-center justify-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-white flex-shrink-0" />
          <span className="font-black text-sm uppercase tracking-widest text-white">
            Pemenang Sah & Terverifikasi
          </span>
        </div>

        <div className="py-2">
          <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest mb-1">Kode Kupon</p>
          <p className="text-4xl sm:text-6xl font-black text-white font-mono tracking-[0.2em] drop-shadow-sm">
            {voucher.code}
          </p>
        </div>

        <p className="text-xs text-white/80 font-bold leading-relaxed">
          🏆 Selamat kepada pemenang! Silakan menuju panggung utama untuk verifikasi akhir dan pengambilan hadiah.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white border-4 border-[#E70013] text-[#E70013] max-w-xl mx-auto space-y-3 shadow-xl">
      <div className="flex items-center justify-center gap-2">
        <Clock className="w-5 h-5 text-[#E70013] animate-pulse flex-shrink-0" />
        <span className="font-black text-sm uppercase tracking-widest">
          Kode Terpilih — Menunggu Kehadiran
        </span>
      </div>

      <div className="py-2">
        <p className="text-[11px] font-bold text-[#E70013]/60 uppercase tracking-widest mb-1">Kode Kupon</p>
        <p className="text-4xl sm:text-6xl font-black text-[#E70013] font-mono tracking-[0.2em] drop-shadow-sm">
          {voucher.code}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-1.5 text-xs font-bold text-[#E70013]/80 leading-relaxed border-t-2 border-[#E70013]/15 pt-3">
        <p>
          📢 Memanggil pemegang kode{' '}
          <strong className="font-black underline">{voucher.code}</strong>{' '}
          untuk menuju panggung utama.
        </p>
      </div>
    </div>
  );
};

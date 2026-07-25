import React from 'react';
import { Voucher } from '@/types';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface WinnerBannerProps {
  voucher: Voucher;
  isConfirmed: boolean;
}

export const WinnerBanner: React.FC<WinnerBannerProps> = ({ voucher, isConfirmed }) => {
  if (isConfirmed) {
    return (
      <div className="p-6 rounded-3xl bg-[#E70013] border-4 border-[#E70013] text-white max-w-xl mx-auto space-y-2 shadow-2xl">
        <div className="inline-flex items-center gap-2 text-white font-black text-sm uppercase">
          <CheckCircle2 className="w-5 h-5 text-white" />
          PEMENANG SAH & TERVERIFIKASI
        </div>
        <p className="text-3xl font-black text-white font-mono tracking-widest">
          KODE KUPON: {voucher.code}
        </p>
        <p className="text-xs text-white font-bold">
          Selamat kepada pemenang! Silakan menuju panggung utama untuk verifikasi akhir.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-white border-4 border-[#E70013] text-[#E70013] max-w-xl mx-auto space-y-2 shadow-xl animate-pulse">
      <div className="inline-flex items-center gap-2 font-black text-sm uppercase">
        <AlertTriangle className="w-5 h-5 text-[#E70013]" />
        KODE KUPON TERPILIH — MENUNGGU VERIFIKASI
      </div>
      <p className="text-3xl font-black font-mono tracking-widest">
        KODE KUPON: {voucher.code}
      </p>
      <p className="text-xs font-bold">
        Memanggil pemegang kode kupon <span className="font-black underline">{voucher.code}</span> untuk menuju panggung utama. 
        Tekan <strong className="font-black underline">"Konfirmasi Pemenang"</strong> jika hadir atau <strong className="font-black underline">"Gugurkan & Undi Ulang"</strong> jika tidak hadir.
      </p>
    </div>
  );
};

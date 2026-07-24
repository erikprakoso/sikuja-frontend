import React from 'react';
import { Voucher } from '@/types';
import { Sparkles, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';

interface WinnerBannerProps {
  voucher: Voucher;
  isConfirmed: boolean;
}

export const WinnerBanner: React.FC<WinnerBannerProps> = ({ voucher, isConfirmed }) => {
  if (isConfirmed) {
    return (
      <div className="p-6 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400/80 max-w-xl mx-auto space-y-2 animate-bounce-subtle shadow-2xl shadow-emerald-950/60">
        <div className="inline-flex items-center gap-2 text-emerald-300 font-extrabold text-sm uppercase">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          PEMENANG RESMI & SAH!
        </div>
        <p className="text-3xl font-black text-white font-mono tracking-widest">
          KODE VOUCHER: {voucher.code}
        </p>
        <p className="text-xs text-emerald-200">
          Status telah diubah ke MENANG. Peserta dipersilakan mengambil hadiah di verifikasi panggung.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-amber-500/20 border-2 border-amber-400/80 max-w-xl mx-auto space-y-2 shadow-2xl shadow-amber-950/60 animate-pulse">
      <div className="inline-flex items-center gap-2 text-amber-300 font-extrabold text-sm uppercase">
        <AlertTriangle className="w-5 h-5 text-amber-400" />
        KODE TERPILIH — MENUNGGU VERIFIKASI KEHADIRAN
      </div>
      <p className="text-3xl font-black text-white font-mono tracking-widest">
        KODE VOUCHER: {voucher.code}
      </p>
      <p className="text-xs text-amber-200 font-medium">
        Memanggil pemilik kode <span className="font-bold text-white underline">{voucher.code}</span> untuk maju ke panggung! 
        Klik <strong className="text-emerald-300 font-bold">"Sahkan Pemenang"</strong> jika hadir, atau <strong className="text-red-400 font-bold">"Peserta Tidak Hadir"</strong> jika gugur.
      </p>
    </div>
  );
};

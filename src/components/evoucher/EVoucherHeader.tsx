import React from 'react';
import { Sparkles, Share2, CheckCircle2 } from 'lucide-react';

interface EVoucherHeaderProps {
  totalVouchers: number;
  checkinCount: number;
  qrDataUrl?: string;
  copied: boolean;
  onShare: () => void;
}

export const EVoucherHeader: React.FC<EVoucherHeaderProps> = ({
  totalVouchers,
  checkinCount,
  qrDataUrl,
  copied,
  onShare,
}) => {
  const isFullyCheckedIn = totalVouchers > 0 && checkinCount >= totalVouchers;

  return (
    <div className="relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E70013] text-white text-xs font-bold uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5 text-white" />
        Kartu E-Voucher Resmi 🇮🇩
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
        VOUCHER JALAN SEHAT 2026
      </h1>

      <div className="flex items-center justify-center gap-3 text-xs font-bold text-slate-600">
        <span>Jumlah: <strong className="text-slate-900">{totalVouchers} Kupon</strong></span>
        <span>•</span>
        <span className="text-emerald-700 font-bold">{checkinCount} Terverifikasi</span>
      </div>

      {/* State Switch: QR Code or Completed Badge */}
      {isFullyCheckedIn ? (
        <div className="py-3.5 px-5 rounded-2xl bg-emerald-800 text-white border border-emerald-800 space-y-1 animate-fade-in shadow-md max-w-sm mx-auto">
          <div className="inline-flex items-center gap-2 text-white font-bold text-sm uppercase">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
            Verifikasi Pos Selesai
          </div>
          <p className="text-xs font-bold text-white">
            Seluruh {totalVouchers} kupon telah terverifikasi dan masuk dalam sistem undian 🏆
          </p>
          <p className="text-[10px] text-emerald-200 font-semibold">
            QR Code telah terverifikasi di pos pemeriksaan.
          </p>
        </div>
      ) : (
        qrDataUrl && (
          <div className="py-2">
            <div className="p-3 bg-white rounded-2xl shadow-md inline-block border border-slate-300">
              <img src={qrDataUrl} alt="Kode QR E-Voucher" className="w-48 h-48 sm:w-56 sm:h-56 object-contain" />
            </div>
            <p className="text-[11px] text-slate-600 font-semibold mt-2">
              Tunjukkan QR Code di atas kepada petugas pos pemeriksaan.
            </p>
          </div>
        )
      )}

      <div className="pt-2">
        <button
          onClick={onShare}
          className="px-4 py-2.5 rounded-xl bg-[#E70013] text-white text-xs font-bold inline-flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95 border border-[#E70013]"
        >
          <Share2 className="w-4 h-4" />
          {copied ? 'Tautan Tersalin!' : 'Bagikan / Simpan Tautan Halaman Ini'}
        </button>
      </div>
    </div>
  );
};

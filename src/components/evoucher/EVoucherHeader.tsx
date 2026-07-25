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
    <div className="relative overflow-hidden bg-white border-4 border-[#E70013] rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xl">
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E70013] text-white text-xs font-black uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
        Kartu E-Voucher Resmi 🇮🇩
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-[#E70013]">
        VOUCHER JALAN SEHAT 2026
      </h1>

      <div className="flex items-center justify-center gap-3 text-xs font-black text-[#E70013]">
        <span>Jumlah: <strong>{totalVouchers} Kupon</strong></span>
        <span>•</span>
        <span>{checkinCount} Terverifikasi</span>
      </div>

      {/* State Switch: QR Code or Completed Green Badge */}
      {isFullyCheckedIn ? (
        <div className="py-3 px-4 rounded-2xl bg-[#E70013] text-white border-2 border-[#E70013] space-y-1 animate-fade-in shadow-xl max-w-sm mx-auto">
          <div className="inline-flex items-center gap-2 text-white font-black text-sm uppercase">
            <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
            Verifikasi Pos Selesai
          </div>
          <p className="text-xs font-black text-white">
            Seluruh {totalVouchers} kupon telah terverifikasi dan masuk dalam sistem undian 🏆
          </p>
          <p className="text-[10px] text-white font-bold">
            QR Code telah terverifikasi di pos pemeriksaan.
          </p>
        </div>
      ) : (
        qrDataUrl && (
          <div className="py-2">
            <div className="p-3 bg-white rounded-2xl shadow-xl inline-block border-4 border-[#E70013]">
              <img src={qrDataUrl} alt="Kode QR E-Voucher" className="w-48 h-48 sm:w-56 sm:h-56 object-contain" />
            </div>
            <p className="text-[11px] text-[#E70013] font-black mt-2">
              Tunjukkan QR Code di atas kepada petugas pos pemeriksaan.
            </p>
          </div>
        )
      )}

      <div className="pt-2">
        <button
          onClick={onShare}
          className="px-4 py-2 rounded-xl bg-[#E70013] text-white text-xs font-black inline-flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-95 border-2 border-[#E70013]"
        >
          <Share2 className="w-4 h-4" />
          {copied ? 'Tautan Tersalin!' : 'Bagikan / Simpan Tautan Halaman Ini'}
        </button>
      </div>
    </div>
  );
};

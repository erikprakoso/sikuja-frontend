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
    <div className="relative overflow-hidden bg-gradient-to-br from-red-950 via-slate-900 to-red-900 border border-red-800/40 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
        Bukti E-Voucher Digital 🇮🇩
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-white">
        KUPON JALAN SEHAT AGUSTUSAN
      </h1>

      <div className="flex items-center justify-center gap-3 text-xs text-slate-300">
        <span>Total: <strong className="text-white">{totalVouchers} Voucher</strong></span>
        <span>•</span>
        <span className="text-emerald-400 font-bold">{checkinCount} Sudah Check-In Pos</span>
      </div>

      {/* State Switch: QR Code or Completed Green Badge */}
      {isFullyCheckedIn ? (
        <div className="py-3 px-4 rounded-2xl bg-emerald-950/90 border-2 border-emerald-500 text-emerald-200 space-y-1 animate-fade-in shadow-2xl max-w-sm mx-auto">
          <div className="inline-flex items-center gap-2 text-emerald-300 font-black text-sm uppercase">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            Check-In Pos Selesai!
          </div>
          <p className="text-xs font-bold text-white">
            Seluruh {totalVouchers} Kupon Sah Ikut Pengocokan Undian 🏆
          </p>
          <p className="text-[10px] text-emerald-300/80">
            QR Code disembunyikan karena sudah berhasil terverifikasi di Pos Rute.
          </p>
        </div>
      ) : (
        qrDataUrl && (
          <div className="py-2">
            <div className="p-3 bg-white rounded-2xl shadow-xl inline-block border-4 border-cyan-400">
              <img src={qrDataUrl} alt="1 QR Transaksi E-Voucher" className="w-48 h-48 sm:w-56 sm:h-56 object-contain" />
            </div>
            <p className="text-[11px] text-cyan-300 font-semibold mt-2">
              📲 Tunjukkan 1 QR di atas ke HP Panitia Pos untuk Check-In 1x Semua Kupon Anda
            </p>
          </div>
        )
      )}

      <div className="pt-2">
        <button
          onClick={onShare}
          className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-red-700/50 text-red-300 text-xs font-bold inline-flex items-center gap-2 transition-all shadow-md"
        >
          <Share2 className="w-4 h-4" />
          {copied ? 'Link Tersalin!' : 'Bagikan / Simpan Bookmark Link ini'}
        </button>
      </div>
    </div>
  );
};

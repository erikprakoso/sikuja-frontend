import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface EVoucherHeaderProps {
  totalVouchers: number;
  checkinCount: number;
  qrDataUrl?: string;
  customerName?: string;
  customerPhone?: string;
}

export const EVoucherHeader: React.FC<EVoucherHeaderProps> = ({
  totalVouchers,
  checkinCount,
  qrDataUrl,
  customerName,
  customerPhone,
}) => {
  const isFullyCheckedIn = totalVouchers > 0 && checkinCount >= totalVouchers;
  const progressPct = totalVouchers > 0 ? (checkinCount / totalVouchers) * 100 : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      {/* Top Row: Brand (kiri) + QR (kanan) */}
      <div className="flex items-center gap-3">
        <img
          src="/logo-ri.png"
          alt="Logo Jalan Sehat 2026"
          className="h-12 w-12 shrink-0 object-contain"
        />

        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E70013] text-white text-[9px] font-bold uppercase tracking-wider">
            <Sparkles className="w-2.5 h-2.5 text-white" />
            Kartu E-Voucher Resmi 🇮🇩
          </div>
          <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight mt-1">
            VOUCHER JALAN SEHAT 2026
          </h1>
          {customerName && (
            <p className="text-[11px] font-bold text-slate-700 break-words leading-snug mt-0.5">
              Pemilik: <span className="text-[#E70013] font-black">{customerName}</span>
              {customerPhone ? ` (${customerPhone})` : ''}
            </p>
          )}
        </div>

        {!isFullyCheckedIn && qrDataUrl && (
          <div className="shrink-0">
            <div className="p-1.5 bg-white rounded-xl shadow-md border border-slate-300">
              <img src={qrDataUrl} alt="Kode QR E-Voucher" className="w-28 h-28 sm:w-32 sm:h-32 object-contain" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Row: Status Verifikasi */}
      {isFullyCheckedIn ? (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-800 text-white px-3 py-2 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
          <span className="text-[11px] font-bold">
            Verifikasi Pos Selesai — {totalVouchers} kupon masuk sistem undian 🏆
          </span>
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span>
              Jumlah: <strong className="text-slate-900">{totalVouchers} Kupon</strong>
            </span>
            <span className="text-emerald-700">
              {checkinCount} Terverifikasi
            </span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

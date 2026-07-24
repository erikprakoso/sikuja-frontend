import React from 'react';
import { Transaction, Voucher } from '@/types';
import {
  CheckCircle2,
  Ticket,
  QrCode as QrIcon,
  Copy,
  ExternalLink,
  Printer,
} from 'lucide-react';

interface TransactionResultProps {
  transaction: Transaction;
  vouchers: Voucher[];
  qrDataUrl: string;
  copied: boolean;
  onCopyLink: () => void;
  onOpenPrintModal: () => void;
  onResetForm: () => void;
}

export const TransactionResult: React.FC<TransactionResultProps> = ({
  transaction,
  vouchers,
  qrDataUrl,
  copied,
  onCopyLink,
  onOpenPrintModal,
  onResetForm,
}) => {
  const etokenUrl = typeof window !== 'undefined' ? `${window.location.origin}/v/${transaction.token}` : '';
  const physicalVouchers = vouchers.filter((v) => v.type === 'fisik');

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-3 text-emerald-400">
          <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
          <div>
            <h2 className="text-xl font-black text-white">Transaksi Berhasil Diterbitkan!</h2>
            <p className="text-xs text-slate-400">
              Total {transaction.qty_fisik + transaction.qty_non_fisik} voucher • Rp{' '}
              {transaction.total_harga.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* E-Voucher QR Section */}
          {transaction.qty_non_fisik > 0 && (
            <div className="bg-slate-950 border border-cyan-500/30 rounded-2xl p-6 text-center space-y-4 flex flex-col items-center justify-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-bold">
                <QrIcon className="w-3.5 h-3.5" />
                1 QR Transaksi E-Voucher
              </div>
              <p className="text-xs text-slate-300">
                Minta pembeli <strong>scan QR di bawah 1x saja</strong> pakai kamera HP (tanpa app/tanpa login) untuk membuka {transaction.qty_non_fisik} e-voucher milik mereka.
              </p>

              {qrDataUrl && (
                <div className="p-3 bg-white rounded-2xl shadow-lg inline-block border-4 border-cyan-400">
                  <img src={qrDataUrl} alt="E-Voucher QR Code" className="w-56 h-56 object-contain" />
                </div>
              )}

              <div className="flex items-center gap-2 w-full max-w-sm">
                <button
                  onClick={onCopyLink}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                >
                  <Copy className="w-4 h-4 text-cyan-400" />
                  {copied ? 'Tersalin!' : 'Salin Link E-Voucher'}
                </button>

                <a
                  href={etokenUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 transition-colors"
                  title="Buka Pratinjau E-Voucher"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {/* Physical Vouchers List Section */}
          {transaction.qty_fisik > 0 && (
            <div className="bg-slate-950 border border-red-900/40 rounded-2xl p-6 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950 border border-red-800 text-red-300 text-xs font-bold">
                <Ticket className="w-3.5 h-3.5" />
                {transaction.qty_fisik} Kode Voucher Fisik (Salin ke Kertas)
              </div>
              <p className="text-xs text-slate-400">
                Tuliskan/cocokkan kode 5-digit angka murni di bawah ke lembar kertas fisik yang dipegang peserta:
              </p>

              <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {physicalVouchers.map((v, idx) => (
                  <div
                    key={v.code}
                    className="p-3 bg-slate-900 border border-red-800/40 rounded-xl text-center shadow-inner"
                  >
                    <span className="text-[10px] text-slate-500 font-mono block">#Fisik {idx + 1}</span>
                    <span className="text-2xl font-black text-red-400 font-mono tracking-widest block">
                      {v.code}
                    </span>
                  </div>
                ))}
              </div>

              {/* Print Button */}
              <div className="pt-2">
                <button
                  onClick={onOpenPrintModal}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  🖨️ Cetak / Pratinjau Struk Thermal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Row */}
        <div className="pt-4 flex items-center justify-between gap-4">
          <button
            onClick={onOpenPrintModal}
            className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            🖨️ Pratinjau & Cetak Struk
          </button>

          <button
            onClick={onResetForm}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-sm shadow-lg shadow-red-950/60 transition-all hover:scale-105"
          >
            + Transaksi Penjualan Selanjutnya
          </button>
        </div>
      </div>
    </div>
  );
};

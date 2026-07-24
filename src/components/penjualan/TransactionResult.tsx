import React from 'react';
import { Transaction, Voucher } from '@/types';
import { getAppBaseUrl } from '@/lib/storage';
import {
  CheckCircle2,
  Ticket,
  QrCode as QrIcon,
  Copy,
  ExternalLink,
  Printer,
  PlusCircle,
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
  const baseUrl = getAppBaseUrl();
  const etokenUrl = `${baseUrl}/v/${transaction.token}`;
  const physicalVouchers = vouchers.filter((v) => v.type === 'fisik');
  const totalLembar = transaction.qty_fisik + transaction.qty_non_fisik;

  return (
    <div className="bg-slate-900/95 border border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-fade-in">
      {/* Compact Success Header Bar */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
        <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-white leading-tight">Transaksi Berhasil Diterbitkan!</h2>
          <p className="text-xs text-slate-400">
            {totalLembar} Voucher ({transaction.qty_fisik} Fisik, {transaction.qty_non_fisik} Digital) •{' '}
            <span className="text-amber-400 font-mono font-bold">Rp {transaction.total_harga.toLocaleString('id-ID')}</span>
          </p>
        </div>
      </div>

      {/* Main Content Layout (Flex / Auto-grid depending on voucher mix) */}
      <div className={`grid gap-4 ${transaction.qty_non_fisik > 0 && transaction.qty_fisik > 0 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {/* E-Voucher QR Section */}
        {transaction.qty_non_fisik > 0 && (
          <div className="bg-slate-950 border border-cyan-500/30 rounded-2xl p-4 text-center space-y-3 flex flex-col items-center justify-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-[11px] font-bold">
              <QrIcon className="w-3.5 h-3.5" />
              QR Transaksi E-Voucher ({transaction.qty_non_fisik} lbr)
            </div>

            {qrDataUrl && (
              <div className="p-2 bg-white rounded-xl inline-block border-2 border-cyan-400 shadow-md">
                <img src={qrDataUrl} alt="E-Voucher QR Code" className="w-40 h-40 object-contain" />
              </div>
            )}

            <p className="text-[11px] text-cyan-200/90 leading-tight">
              📲 Pembeli scan QR di atas pakai kamera HP untuk melihat e-voucher.
            </p>

            <div className="flex items-center gap-2 w-full max-w-xs pt-1">
              <button
                onClick={onCopyLink}
                className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                {copied ? 'Tersalin!' : 'Salin Link'}
              </button>

              <a
                href={etokenUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 transition-colors"
                title="Buka Link E-Voucher"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Physical Vouchers List Section */}
        {transaction.qty_fisik > 0 && (
          <div className="bg-slate-950 border border-red-900/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950 border border-red-800 text-red-300 text-[11px] font-bold">
                <Ticket className="w-3.5 h-3.5" />
                {transaction.qty_fisik} Kode Voucher Fisik
              </div>
              <span className="text-[10px] text-slate-400">Salin ke kertas kupon</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {physicalVouchers.map((v, idx) => (
                <div
                  key={v.code}
                  className="p-2 bg-slate-900 border border-red-800/40 rounded-xl text-center shadow-inner"
                >
                  <span className="text-[9px] text-slate-500 font-mono block">#Fisik {idx + 1}</span>
                  <span className="text-xl font-black text-red-400 font-mono tracking-widest block">
                    {v.code}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Single Clean Bottom Action Footer Bar */}
      <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
        <button
          onClick={onOpenPrintModal}
          className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-2 transition-all"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          <span>Cetak Struk</span>
        </button>

        <button
          onClick={onResetForm}
          className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Transaksi Selanjutnya</span>
        </button>
      </div>
    </div>
  );
};

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
  const digitalVouchers = vouchers.filter((v) => v.type !== 'fisik');
  const totalLembar = transaction.qty_fisik + transaction.qty_non_fisik;

  const cardCount =
    (transaction.qty_non_fisik > 0 ? 1 : 0) +
    (physicalVouchers.length > 0 ? 1 : 0) +
    (digitalVouchers.length > 0 ? 1 : 0);

  return (
    <div className="bg-white border border-[#E70013]/20 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-slate-200">
        <div className="w-11 h-11 rounded-2xl bg-[#E70013] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 leading-tight">Transaksi Berhasil</h2>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Penerbitan {totalLembar} voucher ({transaction.qty_fisik} Fisik, {transaction.qty_non_fisik} Digital) • Total:{' '}
            <span className="font-mono font-black text-[#E70013]">Rp {transaction.total_harga.toLocaleString('id-ID')}</span>
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className={`grid gap-5 ${cardCount > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {/* E-Voucher QR Section */}
        {transaction.qty_non_fisik > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-3.5 flex flex-col items-center justify-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold">
              <QrIcon className="w-3.5 h-3.5" />
              QR E-Voucher Digital ({transaction.qty_non_fisik} Lembar)
            </div>

            {qrDataUrl && (
              <div className="p-3 bg-white rounded-2xl inline-block border border-slate-200 shadow-md">
                <img src={qrDataUrl} alt="Kode QR E-Voucher" className="w-44 h-44 object-contain" />
              </div>
            )}

            <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-xs">
              Tunjukkan kode QR kepada pembeli untuk di-scan via smartphone.
            </p>

            <div className="flex items-center gap-2 w-full max-w-xs pt-1">
              <button
                onClick={onCopyLink}
                className="flex-1 py-2 px-3 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95 shadow-xs hover:border-[#E70013] hover:text-[#E70013]"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Tersalin!' : 'Salin Tautan'}
              </button>

              <a
                href={etokenUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-[#E70013] text-white transition-colors cursor-pointer active:scale-95 shadow-xs"
                title="Buka Tautan E-Voucher"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* Physical Vouchers List Section */}
        {transaction.qty_fisik > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold">
                <Ticket className="w-3.5 h-3.5" />
                Daftar Kupon Fisik ({transaction.qty_fisik} Lembar)
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Salin ke kupon fisik</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto pr-1">
              {physicalVouchers.map((v, idx) => (
                <div
                  key={v.code}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center shadow-2xs"
                >
                  <span className="text-[10px] text-slate-500 font-mono font-bold block">#Kupon {idx + 1}</span>
                  <span className="text-xl font-black text-slate-900 font-mono tracking-wider block mt-0.5">
                    {v.code}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Digital E-Voucher Codes List Section (sama seperti fisik) */}
        {digitalVouchers.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold">
                <Ticket className="w-3.5 h-3.5" />
                Daftar Kupon Digital ({digitalVouchers.length} Lembar)
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Kode juga di kartu E-Voucher</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto pr-1">
              {digitalVouchers.map((v, idx) => (
                <div
                  key={v.code}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center shadow-2xs"
                >
                  <span className="text-[10px] text-slate-500 font-mono font-bold block">#Kupon {idx + 1}</span>
                  <span className="text-xl font-black text-slate-900 font-mono tracking-wider block mt-0.5">
                    {v.code}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer Bar */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
        <button
          onClick={onOpenPrintModal}
          className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-white border border-slate-300 text-slate-700 hover:border-[#E70013] hover:text-[#E70013] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-xs"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Struk Pembayaran</span>
        </button>

        <button
          onClick={onResetForm}
          className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-[#E70013] hover:bg-[#E70013]/90 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 border border-[#E70013]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Transaksi Penjualan Baru</span>
        </button>
      </div>
    </div>
  );
};

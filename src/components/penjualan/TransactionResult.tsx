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
    <div className="bg-white border-4 border-[#E70013] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 animate-fade-in">
      {/* Header Bar */}
      <div className="flex items-center gap-3 pb-3 border-b-2 border-[#E70013]">
        <div className="w-10 h-10 rounded-2xl bg-[#E70013] text-white flex items-center justify-center flex-shrink-0 shadow">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-black text-[#E70013] leading-tight">Transaksi Berhasil</h2>
          <p className="text-xs text-[#E70013] font-bold">
            Penerbitan {totalLembar} voucher ({transaction.qty_fisik} Fisik, {transaction.qty_non_fisik} Digital) selesai • Total:{' '}
            <span className="font-mono font-black">Rp {transaction.total_harga.toLocaleString('id-ID')}</span>
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className={`grid gap-4 ${transaction.qty_non_fisik > 0 && transaction.qty_fisik > 0 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {/* E-Voucher QR Section */}
        {transaction.qty_non_fisik > 0 && (
          <div className="bg-white border-2 border-[#E70013] rounded-2xl p-4 text-center space-y-3 flex flex-col items-center justify-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E70013] text-white text-[11px] font-black">
              <QrIcon className="w-3.5 h-3.5" />
              QR E-Voucher Digital ({transaction.qty_non_fisik} Lembar)
            </div>

            {qrDataUrl && (
              <div className="p-2 bg-white rounded-xl inline-block border-4 border-[#E70013] shadow-md">
                <img src={qrDataUrl} alt="Kode QR E-Voucher" className="w-40 h-40 object-contain" />
              </div>
            )}

            <p className="text-[11px] text-[#E70013] font-bold leading-tight">
              Tunjukkan kode QR kepada pembeli untuk di-scan melalui kamera smartphone.
            </p>

            <div className="flex items-center gap-2 w-full max-w-xs pt-1">
              <button
                onClick={onCopyLink}
                className="flex-1 py-1.5 px-3 rounded-xl bg-white border-2 border-[#E70013] text-[#E70013] text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95 shadow-sm hover:bg-[#E70013] hover:text-white"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Tersalin!' : 'Salin Tautan E-Voucher'}
              </button>

              <a
                href={etokenUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-[#E70013] text-white transition-colors cursor-pointer active:scale-95 shadow-sm"
                title="Buka Tautan E-Voucher"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Physical Vouchers List Section */}
        {transaction.qty_fisik > 0 && (
          <div className="bg-white border-2 border-[#E70013] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E70013] text-white text-[11px] font-black">
                <Ticket className="w-3.5 h-3.5" />
                Daftar Kupon Fisik ({transaction.qty_fisik} Lembar)
              </div>
              <span className="text-[10px] text-[#E70013] font-bold">Disalin ke lembar kupon fisik</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {physicalVouchers.map((v, idx) => (
                <div
                  key={v.code}
                  className="p-2 bg-white border-2 border-[#E70013] rounded-xl text-center shadow-sm"
                >
                  <span className="text-[9px] text-[#E70013] font-mono font-bold block">#Kupon {idx + 1}</span>
                  <span className="text-xl font-black text-[#E70013] font-mono tracking-widest block">
                    {v.code}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer Bar */}
      <div className="pt-2 flex items-center justify-between gap-3 border-t-2 border-[#E70013]">
        <button
          onClick={onOpenPrintModal}
          className="py-2.5 px-4 rounded-xl bg-white border-2 border-[#E70013] text-[#E70013] hover:bg-[#E70013] hover:text-white font-black text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Struk Pembayaran</span>
        </button>

        <button
          onClick={onResetForm}
          className="py-2.5 px-5 rounded-xl bg-[#E70013] hover:bg-[#E70013]/90 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border-2 border-[#E70013]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Transaksi Penjualan Baru</span>
        </button>
      </div>
    </div>
  );
};

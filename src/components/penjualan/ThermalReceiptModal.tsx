import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Transaction, Voucher } from '@/types';
import { getAppBaseUrl } from '@/lib/storage';
import { Printer, X } from 'lucide-react';

interface ThermalReceiptModalProps {
  transaction: Transaction;
  vouchers: Voucher[];
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  transaction,
  vouchers,
  onClose,
}) => {
  const physicalVouchers = vouchers.filter((v) => v.type === 'fisik');
  const [txQrUrl, setTxQrUrl] = useState<string>('');

  useEffect(() => {
    const baseUrl = getAppBaseUrl();
    const fullUrl = `${baseUrl}/v/${transaction.token}`;
      
    QRCode.toDataURL(fullUrl, {
      width: 160,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => setTxQrUrl(url))
      .catch((err) => console.error('Tx QR gen error', err));
  }, [transaction.token]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full space-y-6 shadow-2xl relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-400" />
            Pratinjau Struk Penjualan
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Simulated 58mm Thermal Paper Card */}
        <div className="bg-white text-black font-mono text-xs p-4 rounded-xl shadow-inner border border-gray-300 max-h-96 overflow-y-auto w-[260px] mx-auto space-y-3 leading-tight">
          <div className="text-center pb-2 border-b border-black border-dashed space-y-1">
            <p className="font-extrabold text-sm uppercase">PANITIA JALAN SEHAT 🇮🇩</p>
            <p className="text-[10px] font-bold text-gray-700">SIKUJA 2026</p>
            <p className="text-[9px] text-gray-600">
              Tx: {transaction.id.slice(-8)} • {new Date(transaction.created_at).toLocaleTimeString('id-ID')}
            </p>
          </div>

          {/* QR Code Section */}
          <div className="text-center py-1 border-b border-black border-dashed space-y-1">
            <p className="text-[9px] font-bold uppercase text-gray-700">QR CODE E-VOUCHER</p>
            {txQrUrl && (
              <img
                src={txQrUrl}
                alt="QR Code E-Voucher"
                className="w-24 h-24 mx-auto border border-black p-0.5 my-1"
              />
            )}
            <p className="text-[8px] text-gray-600">Pindaikan QR Code untuk Check-in</p>
          </div>

          {/* Physical Vouchers List */}
          {physicalVouchers.length > 0 && (
            <div className="space-y-1.5 my-2">
              <p className="text-[9px] font-bold text-center uppercase text-gray-800">
                KODE KUPON FISIK ({physicalVouchers.length} LBR):
              </p>
              {physicalVouchers.map((v, idx) => (
                <div key={v.code} className="flex justify-between items-center px-2 py-1 bg-gray-100 rounded border border-gray-300 font-mono text-xs">
                  <span className="text-[9px] text-gray-600">#Kupon {idx + 1}</span>
                  <span className="font-black text-sm tracking-widest">{v.code}</span>
                </div>
              ))}
            </div>
          )}

          <div className="text-center pt-2 border-t border-black border-dashed text-[9px] space-y-1">
            <p className="font-bold">
              Total: {transaction.qty_fisik + transaction.qty_non_fisik} Lbr • Rp {transaction.total_harga.toLocaleString('id-ID')}
            </p>
            <p className="text-gray-700">Terima Kasih atas Partisipasi Anda</p>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-950/60 cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
};

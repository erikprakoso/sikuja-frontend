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
      color: { dark: '#E70013', light: '#ffffff' },
    })
      .then((url) => setTxQrUrl(url))
      .catch((err) => console.error('Tx QR gen error', err));
  }, [transaction.token]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print animate-fade-in">
      <div className="bg-white border-4 border-[#E70013] rounded-3xl p-6 max-w-sm w-full space-y-6 shadow-2xl relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-[#E70013] pb-3">
          <h3 className="text-sm font-black text-[#E70013] flex items-center gap-2">
            <Printer className="w-4 h-4 text-[#E70013]" />
            Pratinjau Struk Penjualan
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-[#E70013] text-white hover:opacity-90 transition-colors cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Simulated 58mm Thermal Paper Card */}
        <div className="bg-white text-[#E70013] font-mono text-xs p-4 rounded-xl shadow-inner border-2 border-[#E70013] max-h-96 overflow-y-auto w-[260px] mx-auto space-y-3 leading-tight">
          <div className="text-center pb-2 border-b-2 border-[#E70013] border-dashed space-y-1">
            <p className="font-black text-sm uppercase">PANITIA JALAN SEHAT 🇮🇩</p>
            <p className="text-[10px] font-black">SIKUJA 2026</p>
            <p className="text-[9px] font-bold">
              Tx: {transaction.id.slice(-8)} • {new Date(transaction.created_at).toLocaleTimeString('id-ID')}
            </p>
          </div>

          {/* QR Code Section */}
          <div className="text-center py-1 border-b-2 border-[#E70013] border-dashed space-y-1">
            <p className="text-[9px] font-black uppercase">QR CODE E-VOUCHER</p>
            {txQrUrl && (
              <img
                src={txQrUrl}
                alt="QR Code E-Voucher"
                className="w-24 h-24 mx-auto border-2 border-[#E70013] p-0.5 my-1"
              />
            )}
            <p className="text-[8px] font-bold">Pindaikan QR Code untuk Check-in</p>
          </div>

          {/* Physical Vouchers List */}
          {physicalVouchers.length > 0 && (
            <div className="space-y-1.5 my-2">
              <p className="text-[9px] font-black text-center uppercase">
                KODE KUPON FISIK ({physicalVouchers.length} LBR):
              </p>
              {physicalVouchers.map((v, idx) => (
                <div key={v.code} className="flex justify-between items-center px-2 py-1 bg-white rounded border-2 border-[#E70013] font-mono text-xs">
                  <span className="text-[9px] font-bold">#Kupon {idx + 1}</span>
                  <span className="font-black text-sm tracking-widest">{v.code}</span>
                </div>
              ))}
            </div>
          )}

          <div className="text-center pt-2 border-t-2 border-[#E70013] border-dashed text-[9px] space-y-1">
            <p className="font-black">
              Total: {transaction.qty_fisik + transaction.qty_non_fisik} Lbr • Rp {transaction.total_harga.toLocaleString('id-ID')}
            </p>
            <p className="font-bold">Terima Kasih atas Partisipasi Anda</p>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white border-2 border-[#E70013] text-[#E70013] hover:bg-[#E70013] hover:text-white text-xs font-black transition-all cursor-pointer active:scale-95"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-[#E70013] text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95 border-2 border-[#E70013]"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
};

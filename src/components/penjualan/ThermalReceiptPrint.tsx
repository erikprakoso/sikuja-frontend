import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Transaction, Voucher } from '@/types';
import { getAppBaseUrl } from '@/lib/storage';

interface ThermalReceiptPrintProps {
  transaction: Transaction;
  vouchers: Voucher[];
}

export const ThermalReceiptPrint: React.FC<ThermalReceiptPrintProps> = ({
  transaction,
  vouchers,
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
      .catch((err) => console.error('Tx QR print gen error', err));
  }, [transaction.token]);

  return (
    <div className="hidden print-receipt-area font-mono text-black text-[11px] leading-tight">
      <div className="text-center pb-2 border-b border-black border-dashed mb-2 space-y-0.5">
        <p className="font-bold text-sm">SIKUJA AGUSTUSAN 🇮🇩</p>
        <p className="text-[10px]">Voucher Jalan Sehat 2026</p>
        <p className="text-[9px]">
          Tx: {transaction.id.slice(-8)} • {new Date(transaction.created_at).toLocaleTimeString('id-ID')}
        </p>
      </div>

      {/* 1 QR Transaksi (Scan 1x di Pos Check-in untuk Batch Check-in Semua Kupon) */}
      <div className="text-center py-1 border-b border-black border-dashed space-y-1">
        <p className="text-[9px] font-bold uppercase">1 QR TRANSAKSI (BATCH CHECK-IN)</p>
        {txQrUrl && (
          <img
            src={txQrUrl}
            alt="QR Transaksi"
            className="w-24 h-24 mx-auto border border-black p-0.5 my-1"
          />
        )}
        <p className="text-[8px]">Panitia Pos Cukup Scan 1x QR Di Atas!</p>
      </div>

      {/* Daftar Kode 5-Digit Kupon Fisik */}
      <div className="space-y-1.5 my-2">
        <p className="text-[9px] font-bold text-center uppercase">
          DAFTAR KODE KUPON FISIK ({physicalVouchers.length} LBR):
        </p>
        {physicalVouchers.map((v, idx) => (
          <div key={v.code} className="flex justify-between items-center px-2 py-1 bg-gray-100 rounded border border-gray-300 font-mono text-xs">
            <span className="text-[9px]">#Kupon {idx + 1}</span>
            <span className="font-black text-sm tracking-widest">{v.code}</span>
          </div>
        ))}
      </div>

      <div className="text-center pt-2 border-t border-black border-dashed mt-2 text-[9px] space-y-0.5">
        <p className="font-bold">
          Total: {transaction.qty_fisik} Lbr • Rp {transaction.total_harga.toLocaleString('id-ID')}
        </p>
        <p>Terima Kasih & Dirgahayu RI! 🇮🇩</p>
      </div>
    </div>
  );
};

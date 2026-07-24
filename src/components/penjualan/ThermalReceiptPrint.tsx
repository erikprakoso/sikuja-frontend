import React from 'react';
import { Transaction, Voucher } from '@/types';

interface ThermalReceiptPrintProps {
  transaction: Transaction;
  vouchers: Voucher[];
}

export const ThermalReceiptPrint: React.FC<ThermalReceiptPrintProps> = ({
  transaction,
  vouchers,
}) => {
  const physicalVouchers = vouchers.filter((v) => v.type === 'fisik');

  return (
    <div className="hidden print-receipt-area font-mono text-black text-[11px] leading-tight">
      <div className="text-center pb-2 border-b border-black border-dashed mb-2 space-y-0.5">
        <p className="font-bold text-sm">SIKUJA AGUSTUSAN 🇮🇩</p>
        <p className="text-[10px]">Voucher Jalan Sehat 2026</p>
        <p className="text-[9px]">
          Tx: {transaction.id.slice(-8)} • {new Date(transaction.created_at).toLocaleTimeString('id-ID')}
        </p>
      </div>

      <div className="space-y-3 my-2">
        {physicalVouchers.map((v, idx) => (
          <div key={v.code} className="border border-black p-2 text-center rounded space-y-0.5">
            <p className="text-[9px] font-bold">#KUPON FISIK {idx + 1}</p>
            <p className="text-xl font-black tracking-widest my-0.5">{v.code}</p>
            <p className="text-[8px]">Scan di Pos Rute Jalan Sehat!</p>
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

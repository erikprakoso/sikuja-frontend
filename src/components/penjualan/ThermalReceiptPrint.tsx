import React from 'react';
import { Transaction, Voucher } from '@/types';
import { ReceiptView } from '@/components/penjualan/ReceiptView';

interface ThermalReceiptPrintProps {
  transaction: Transaction;
  vouchers: Voucher[];
}

export const ThermalReceiptPrint: React.FC<ThermalReceiptPrintProps> = ({
  transaction,
  vouchers,
}) => {
  return (
    <div className="hidden print-receipt-area font-mono text-black text-[11px] leading-tight">
      <ReceiptView transaction={transaction} vouchers={vouchers} />
    </div>
  );
};

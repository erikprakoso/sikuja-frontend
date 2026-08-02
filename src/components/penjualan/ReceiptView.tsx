import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Transaction, Voucher } from '@/types';
import { buildReceiptModel, ReceiptQrRow, RECEIPT_LINE_WIDTH } from '@/lib/receipt';

interface ReceiptViewProps {
  transaction: Transaction;
  vouchers: Voucher[];
}

export const ReceiptView: React.FC<ReceiptViewProps> = ({ transaction, vouchers }) => {
  const model = buildReceiptModel(transaction, vouchers);
  const qrRow = model.find((r): r is ReceiptQrRow => r.type === 'qr');
  const qrText = qrRow?.text ?? null;
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    if (!qrText) return;
    let cancelled = false;
    QRCode.toDataURL(qrText, {
      width: 160,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setQrUrl(url);
      })
      .catch((err) => console.error('Tx QR gen error', err));
    return () => {
      cancelled = true;
    };
  }, [qrText]);

  return (
    <div className="font-mono text-xs leading-tight space-y-1.5">
      {model.map((row, idx) => {
        switch (row.type) {
          case 'spacer':
            return <div key={idx} className="h-1.5" />;
          case 'dashed':
            return (
              <div key={idx} className="text-center whitespace-nowrap overflow-hidden text-slate-400 select-none">
                {'-'.repeat(RECEIPT_LINE_WIDTH)}
              </div>
            );
          case 'text':
            return (
              <p
                key={idx}
                className={`${row.align === 'center' ? 'text-center' : 'text-left'} ${
                  row.bold ? 'font-black text-slate-900' : 'text-slate-700'
                } ${row.double ? 'text-sm uppercase' : ''}`}
              >
                {row.text}
              </p>
            );
          case 'line':
            return (
              <div
                key={idx}
                className={`flex justify-between items-baseline gap-2 ${
                  row.bold ? 'font-black text-slate-900' : 'text-slate-700'
                } ${row.double ? 'text-sm' : ''}`}
              >
                <span className="truncate">{row.left}</span>
                {row.right && <span className="whitespace-nowrap">{row.right}</span>}
              </div>
            );
          case 'qr':
            return (
              <div key={idx} className="flex flex-col items-center py-1">
                {qrUrl && (
                  <img
                    src={qrUrl}
                    alt="QR Code E-Voucher"
                    className="w-24 h-24 border border-slate-300 bg-white p-1"
                  />
                )}
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
};

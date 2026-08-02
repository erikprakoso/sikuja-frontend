import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Transaction, Voucher } from '@/types';
import { buildReceiptModel, ReceiptQrRow } from '@/lib/receipt';

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
      width: 200,
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
    <div className="font-mono text-xs leading-snug space-y-2">
      <div className="flex justify-center">
        <img
          src="/logo-ri.png"
          alt="Logo Jalan Sehat 2026"
          className="w-12 h-12 object-contain"
        />
      </div>
      {model.map((row, idx) => {
        switch (row.type) {
          case 'spacer':
            return <div key={idx} className="h-1" />;
          case 'dashed':
            return (
              <div key={idx} className="flex items-center gap-1">
                <span className="flex-1 border-t border-dashed border-slate-300" />
              </div>
            );
          case 'text':
            if (row.bold) {
              return (
                <p
                  key={idx}
                  className={`${row.align === 'center' ? 'text-center' : 'text-left'} ${
                    row.double ? 'text-sm font-black tracking-widest text-slate-900' : 'text-[10px] font-black tracking-[0.15em] uppercase text-slate-800'
                  }`}
                >
                  {row.text}
                </p>
              );
            }
            return (
              <p
                key={idx}
                className={`${row.align === 'center' ? 'text-center' : 'text-left'} text-slate-600`}
              >
                {row.text}
              </p>
            );
          case 'line':
            if (row.variant === 'coupon') {
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-xs"
                >
                  <span className="text-[10px] text-slate-500 font-bold">Kupon {row.left}</span>
                  <span className="font-black text-base tracking-[0.2em] text-slate-900">{row.right}</span>
                </div>
              );
            }
            if (row.variant === 'total') {
              return (
                <div
                  key={idx}
                  className="flex justify-between items-baseline gap-2 pt-2 mt-0.5 border-t border-dashed border-slate-300 text-sm font-black text-slate-900"
                >
                  <span>{row.left}</span>
                  {row.right && <span className="whitespace-nowrap">{row.right}</span>}
                </div>
              );
            }
            return (
              <div
                key={idx}
                className={`flex justify-between items-baseline gap-2 ${
                  row.bold ? 'font-black text-slate-900' : 'text-slate-700'
                }`}
              >
                <span className="truncate">{row.left}</span>
                {row.right && <span className="whitespace-nowrap">{row.right}</span>}
              </div>
            );
          case 'qr':
            return (
              <div key={idx} className="flex flex-col items-center py-0.5">
                {qrUrl && (
                  <img
                    src={qrUrl}
                    alt="QR Code Check-in"
                    className="w-28 h-28 border border-slate-200 bg-white p-1 rounded-lg shadow-xs"
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

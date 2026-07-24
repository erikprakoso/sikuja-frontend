'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { createPurchaseTransaction } from '@/lib/services/voucher';
import { getAppBaseUrl } from '@/lib/storage';
import { Transaction, Voucher } from '@/types';
import { Ticket, RefreshCw } from 'lucide-react';

import { TransactionForm } from '@/components/penjualan/TransactionForm';
import { TransactionResult } from '@/components/penjualan/TransactionResult';
import { ThermalReceiptModal } from '@/components/penjualan/ThermalReceiptModal';
import { ThermalReceiptPrint } from '@/components/penjualan/ThermalReceiptPrint';

export default function PenjualanPage() {
  const [qtyFisik, setQtyFisik] = useState(1);
  const [qtyNonFisik, setQtyNonFisik] = useState(0);
  const [lastTx, setLastTx] = useState<{ transaction: Transaction; vouchers: Voucher[] } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const totalLembar = qtyFisik + qtyNonFisik;

  // Generate QR code image when a transaction is completed
  useEffect(() => {
    if (lastTx && lastTx.transaction.qty_non_fisik > 0) {
      const baseUrl = getAppBaseUrl();
      const fullUrl = `${baseUrl}/v/${lastTx.transaction.token}`;
      QRCode.toDataURL(fullUrl, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR Gen error', err));
    } else {
      setQrDataUrl('');
    }
  }, [lastTx]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalLembar <= 0) return;

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qtyFisik, qtyNonFisik }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        alert(data.error || 'Gagal membuat transaksi');
        return;
      }

      setLastTx({ transaction: data.transaction, vouchers: data.vouchers });
    } catch (err) {
      console.error('Checkout error:', err);
      // Fallback local
      const res = createPurchaseTransaction(qtyFisik, qtyNonFisik);
      setLastTx(res);
    }
  };

  const handleResetForm = () => {
    setLastTx(null);
    setQtyFisik(1);
    setQtyNonFisik(0);
    setQrDataUrl('');
    setCopied(false);
    setShowPrintModal(false);
  };

  const copyToClipboard = () => {
    if (!lastTx) return;
    const url = `${window.location.origin}/v/${lastTx.transaction.token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Screen Interactive UI (Hidden during print) */}
      <div className="no-print space-y-8">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950 border border-red-800 text-red-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Ticket className="w-3.5 h-3.5" />
              Meja Penjualan Kasir
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Transaksi Beli Voucher</h1>
            <p className="text-xs text-slate-400">
              Terbitkan kode 5-digit unik (fisik) atau 1 QR E-Voucher per transaksi.
            </p>
          </div>

          {lastTx && (
            <button
              onClick={handleResetForm}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 transition-all border border-slate-700"
            >
              <RefreshCw className="w-4 h-4 text-red-400" />
              Transaksi Baru
            </button>
          )}
        </div>

        {/* Main Content Layout */}
        {!lastTx ? (
          <TransactionForm
            qtyFisik={qtyFisik}
            qtyNonFisik={qtyNonFisik}
            setQtyFisik={setQtyFisik}
            setQtyNonFisik={setQtyNonFisik}
            onSubmit={handleCheckout}
          />
        ) : (
          <TransactionResult
            transaction={lastTx.transaction}
            vouchers={lastTx.vouchers}
            qrDataUrl={qrDataUrl}
            copied={copied}
            onCopyLink={copyToClipboard}
            onOpenPrintModal={() => setShowPrintModal(true)}
            onResetForm={handleResetForm}
          />
        )}
      </div>

      {/* MODAL PRATINJAU STRUK THERMAL (SCREEN VIEW) */}
      {showPrintModal && lastTx && (
        <ThermalReceiptModal
          transaction={lastTx.transaction}
          vouchers={lastTx.vouchers}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* Hidden Printable Receipt Area for Thermal Printer (58mm) */}
      {lastTx && (
        <ThermalReceiptPrint
          transaction={lastTx.transaction}
          vouchers={lastTx.vouchers}
        />
      )}
    </div>
  );
}

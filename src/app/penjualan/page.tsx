'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { createPurchaseTransaction } from '@/lib/services/voucher';
import { getAppBaseUrl } from '@/lib/storage';
import { Transaction, Voucher } from '@/types';
import { ShoppingBag } from 'lucide-react';

import { TransactionForm } from '@/components/penjualan/TransactionForm';
import { TransactionResult } from '@/components/penjualan/TransactionResult';
import { ThermalReceiptModal } from '@/components/penjualan/ThermalReceiptModal';
import { ThermalReceiptPrint } from '@/components/penjualan/ThermalReceiptPrint';

export default function PenjualanPage() {
  const [qtyFisik, setQtyFisik] = useState(1);
  const [qtyNonFisik, setQtyNonFisik] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris'>('cash');
  const [lastTx, setLastTx] = useState<{ transaction: Transaction; vouchers: Voucher[] } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCheckout = async (e: React.FormEvent, customCodes: string[] = []) => {
    e.preventDefault();
    if (totalLembar <= 0 || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qtyFisik, qtyNonFisik, customCodes }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        alert(data.error || 'Gagal memproses transaksi.');
        setIsSubmitting(false);
        return;
      }

      setLastTx({ transaction: data.transaction, vouchers: data.vouchers });
    } catch (err) {
      console.error('Checkout error:', err);
      // Fallback local memory
      const res = createPurchaseTransaction(qtyFisik, qtyNonFisik, customCodes);
      setLastTx(res);
    } finally {
      setIsSubmitting(false);
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
        <div className="pb-4 border-b-4 border-[#E70013]">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E70013] text-white text-xs font-black uppercase tracking-wider mb-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            Kasir Penjualan Voucher
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#E70013]">Transaksi Penjualan Voucher</h1>
          <p className="text-xs text-[#E70013] font-bold">
            Layanan penerbitan kupon fisik dan e-voucher digital peserta Jalan Sehat.
          </p>
        </div>

        {/* Main Content Layout */}
        {!lastTx ? (
          <TransactionForm
            qtyFisik={qtyFisik}
            qtyNonFisik={qtyNonFisik}
            paymentMethod={paymentMethod}
            isLoading={isSubmitting}
            setQtyFisik={setQtyFisik}
            setQtyNonFisik={setQtyNonFisik}
            setPaymentMethod={setPaymentMethod}
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

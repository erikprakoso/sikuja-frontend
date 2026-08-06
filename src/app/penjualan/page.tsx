'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { getAppBaseUrl } from '@/lib/storage';
import { playSuccessFeedback, playErrorFeedback } from '@/lib/services/feedback';
import { Transaction, Voucher } from '@/types';
import { AlertCircle } from 'lucide-react';

import { RequireAuth } from '@/components/auth/RequireAuth';
import { TransactionForm } from '@/components/penjualan/TransactionForm';
import { TransactionResult } from '@/components/penjualan/TransactionResult';
import { ThermalReceiptModal } from '@/components/penjualan/ThermalReceiptModal';
import { ThermalReceiptPrint } from '@/components/penjualan/ThermalReceiptPrint';

export default function PenjualanPage() {
  const [qtyFisik, setQtyFisik] = useState(1);
  const [qtyNonFisik, setQtyNonFisik] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'free'>('cash');
  const [lastTx, setLastTx] = useState<{ transaction: Transaction; vouchers: Voucher[] } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [conflictCode, setConflictCode] = useState('');
  const copiedTimerRef = useRef<number | null>(null);

  const totalLembar = qtyFisik + qtyNonFisik;

  // Generate QR code image when a transaction is completed
  useEffect(() => {
    if (lastTx && lastTx.transaction.qty_non_fisik > 0) {
      const baseUrl = getAppBaseUrl();
      const fullUrl = `${baseUrl}/v/${lastTx.transaction.token}`;
      QRCode.toDataURL(fullUrl, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR Gen error', err));
    }
  }, [lastTx]);

  const handleCheckout = async (
    e: React.FormEvent,
    customCodes: string[] = [],
    name: string = '',
    phone: string = ''
  ) => {
    e.preventDefault();
    if (totalLembar <= 0 || isSubmitting) return;

    setSubmitError('');
    setConflictCode('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qtyFisik,
          qtyNonFisik,
          customCodes,
          customerName: name,
          customerPhone: phone,
          paymentMethod,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setSubmitError(data.error || 'Gagal memproses transaksi.');
        setConflictCode(data.conflictCode || '');
        playErrorFeedback();
        setIsSubmitting(false);
        return;
      }

      setLastTx({ transaction: data.transaction, vouchers: data.vouchers });
      setConflictCode('');
      playSuccessFeedback();
    } catch (err) {
      console.error('Checkout error:', err);
      // TIDAK menyimpan transaksi lokal: biar tidak ada kode 5-digit ganda antar kasir.
      setSubmitError(
        'Tidak dapat terhubung ke server. Transaksi TIDAK diproses agar kode voucher tidak ganda. Periksa koneksi lalu coba lagi.'
      );
      playErrorFeedback();
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
    setSubmitError('');
    setConflictCode('');
  };

  const copyToClipboard = async () => {
    if (!lastTx) return;
    const url = `${getAppBaseUrl()}/v/${lastTx.transaction.token}`;

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback untuk browser yang menolak Clipboard API (iOS / non-HTTPS).
      try {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        // Salin manual jika semua cara gagal.
      }
    }

    setCopied(true);
    if (copiedTimerRef.current !== null) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  return (
    <RequireAuth roles={['penjual', 'admin']}>
    <div className="max-w-4xl mx-auto py-4">
      {/* Screen Interactive UI (Hidden during print) */}
      <div className="no-print space-y-8">
        {/* Main Content Layout */}
        {submitError && (
          <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-[#E70013] text-white text-sm font-bold shadow-md animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Main Content Layout */}
        {!lastTx ? (
          <TransactionForm
            qtyFisik={qtyFisik}
            qtyNonFisik={qtyNonFisik}
            paymentMethod={paymentMethod}
            isLoading={isSubmitting}
            conflictCode={conflictCode}
            onClearConflict={() => setConflictCode('')}
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
    </RequireAuth>
  );
}

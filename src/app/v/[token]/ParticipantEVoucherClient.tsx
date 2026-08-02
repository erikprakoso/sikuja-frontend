'use client';

import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { getStoredTransactions, getStoredVouchers, getAppBaseUrl, SIKUJA_EVENT_NAME } from '@/lib/storage';
import { Transaction, Voucher } from '@/types';
import { Loader2, Ticket } from 'lucide-react';

import { EVoucherNotFound } from '@/components/evoucher/EVoucherNotFound';
import { EVoucherHeader } from '@/components/evoucher/EVoucherHeader';
import { EVoucherCheckinNotice } from '@/components/evoucher/EVoucherCheckinNotice';
import { EVoucherCardList } from '@/components/evoucher/EVoucherCardList';

interface ParticipantEVoucherClientProps {
  token: string;
  initialData: { transaction: Transaction; vouchers: Voucher[] } | null;
}

export default function ParticipantEVoucherClient({
  token,
  initialData,
}: ParticipantEVoucherClientProps) {
  const [transaction, setTransaction] = useState<Transaction | null>(initialData?.transaction ?? null);
  const [vouchers, setVouchers] = useState<Voucher[]>(initialData?.vouchers ?? []);
  const [txQrDataUrl, setTxQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialData);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/vouchers/${token}`);
      const data = await res.json();

      if (res.ok && data.success && data.transaction) {
        setTransaction(data.transaction);
        setVouchers(data.vouchers || []);
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.error('Fetch e-voucher API error:', err);
    }

    const allTxs = getStoredTransactions();
    const tx = allTxs.find((t) => t.token === token || t.id === token);
    setTransaction(tx || null);

    if (tx) {
      const allV = getStoredVouchers();
      const txV = allV.filter((v) => v.transaction_id === tx.id);
      setVouchers(txV);
    }

    setIsLoading(false);
  }, [token]);

  useEffect(() => {
    // Data sudah di-fetch server-side (first-paint instan). Hanya cek localStorage
    // untuk fallback demo/offline saat server tidak punya data.
    if (!initialData) {
      loadData();
    }
    if (typeof window !== 'undefined') {
      window.addEventListener(SIKUJA_EVENT_NAME, loadData);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(SIKUJA_EVENT_NAME, loadData);
      }
    };
  }, [loadData, initialData]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    }, 5000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [loadData]);

  useEffect(() => {
    if (transaction) {
      const baseUrl = getAppBaseUrl();
      const fullUrl = `${baseUrl}/v/${transaction.token}`;
      QRCode.toDataURL(fullUrl, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
        .then((url) => setTxQrDataUrl(url))
        .catch((err) => console.error('TX QR Gen error:', err));

      // Auto-save token to localStorage so user never loses their E-Voucher
      try {
        localStorage.setItem('sikuja_last_token', transaction.token);
      } catch {
        // Token tersimpan otomatis — abaikan error storage (mis. private mode)
      }
    }
  }, [transaction]);

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'E-Voucher Resmi Jalan Sehat 2026',
          text: `Kartu E-Voucher Resmi Jalan Sehat 2026`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#E70013] text-white flex items-center justify-center shadow-xl">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-[#E70013] flex items-center justify-center gap-2">
            <Ticket className="w-5 h-5 text-[#E70013]" />
            Memuat Data E-Voucher...
          </h2>
          <p className="text-xs font-bold text-[#E70013]">
            Mengambil data transaksi dan status kupon Anda.
          </p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return <EVoucherNotFound token={token} />;
  }

  const checkinCount = vouchers.filter((v) => v.status !== 'terbit').length;

  return (
    <div className="max-w-xl mx-auto space-y-6 py-4 animate-fade-in">
      <EVoucherHeader
        totalVouchers={vouchers.length}
        checkinCount={checkinCount}
        qrDataUrl={txQrDataUrl}
        customerName={transaction.customer_name}
        customerPhone={transaction.customer_phone}
        copied={copied}
        onShare={handleShare}
      />

      <EVoucherCheckinNotice totalVouchers={vouchers.length} checkinCount={checkinCount} />

      <EVoucherCardList vouchers={vouchers} />
    </div>
  );
}

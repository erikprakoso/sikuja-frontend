'use client';

import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { getStoredTransactions, getStoredVouchers, getAppBaseUrl, SIKUJA_EVENT_NAME } from '@/lib/storage';
import { Transaction, Voucher } from '@/types';
import { Loader2, Ticket, MessageSquare, Share2 } from 'lucide-react';

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

  const handleWhatsAppShare = () => {
    if (typeof window !== 'undefined') {
      const text = encodeURIComponent(`Kartu E-Voucher Jalan Sehat 2026 Saya: ${window.location.href}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
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

  const checkinCount = vouchers.filter((v) => v.status !== 'terbit' && v.status !== 'forfeited').length;
  const isFullyCheckedIn = vouchers.length > 0 && checkinCount >= vouchers.length;

  return (
    <div className="max-w-xl mx-auto space-y-3 py-3 animate-fade-in">
      {!isFullyCheckedIn && (
        <EVoucherHeader
          totalVouchers={vouchers.length}
          checkinCount={checkinCount}
          qrDataUrl={txQrDataUrl}
          customerName={transaction.customer_name}
          customerPhone={transaction.customer_phone}
        />
      )}

      <EVoucherCheckinNotice totalVouchers={vouchers.length} checkinCount={checkinCount} />

      <EVoucherCardList vouchers={vouchers} />

      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <button
          onClick={handleWhatsAppShare}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95 border border-emerald-600"
        >
          <MessageSquare className="w-4 h-4" />
          Simpan Ke WhatsApp Saya
        </button>

        <button
          onClick={handleShare}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold inline-flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95 border border-slate-900"
        >
          <Share2 className="w-4 h-4" />
          {copied ? 'Tautan Tersalin!' : 'Bagikan / Salin Tautan'}
        </button>
      </div>
    </div>
  );
}

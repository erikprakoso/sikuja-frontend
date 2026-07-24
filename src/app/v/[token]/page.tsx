'use client';

import React, { useState, useEffect, use } from 'react';
import QRCode from 'qrcode';
import { getStoredTransactions, getStoredVouchers, getAppBaseUrl, SIVOJA_EVENT_NAME } from '@/lib/storage';
import { Transaction, Voucher } from '@/types';

import { EVoucherNotFound } from '@/components/evoucher/EVoucherNotFound';
import { EVoucherHeader } from '@/components/evoucher/EVoucherHeader';
import { EVoucherCheckinNotice } from '@/components/evoucher/EVoucherCheckinNotice';
import { EVoucherCardList } from '@/components/evoucher/EVoucherCardList';

interface Props {
  params: Promise<{ token: string }>;
}

export default function ParticipantEVoucherPage({ params }: Props) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [txQrDataUrl, setTxQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/vouchers/${token}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setTransaction(data.transaction);
        setVouchers(data.vouchers);
        return;
      }
    } catch (err) {
      console.error('Fetch e-voucher API error:', err);
    }

    // Fallback local memory lookup
    const allTxs = getStoredTransactions();
    const tx = allTxs.find((t) => t.token === token || t.id === token);
    setTransaction(tx || null);

    if (tx) {
      const allV = getStoredVouchers();
      const txV = allV.filter((v) => v.transaction_id === tx.id);
      setVouchers(txV);
    }
  };

  useEffect(() => {
    loadData();
    if (typeof window !== 'undefined') {
      window.addEventListener(SIVOJA_EVENT_NAME, loadData);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(SIVOJA_EVENT_NAME, loadData);
      }
    };
  }, [token]);

  // Generate 1 Main Transaction QR Code
  useEffect(() => {
    if (transaction) {
      const baseUrl = getAppBaseUrl();
      const fullUrl = `${baseUrl}/v/${transaction.token}`;
      QRCode.toDataURL(fullUrl, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
        .then((url) => setTxQrDataUrl(url))
        .catch((err) => console.error('TX QR Gen error:', err));
    }
  }, [transaction]);

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'E-Voucher Jalan Sehat SIVOJA',
          text: `Ini link E-Voucher Jalan Sehat Agustusan saya!`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!transaction) {
    return <EVoucherNotFound token={token} />;
  }

  const checkinCount = vouchers.filter((v) => v.status !== 'terbit').length;

  return (
    <div className="max-w-xl mx-auto space-y-6 py-4">
      {/* Header Banner with 1 Main Transaction QR Code */}
      <EVoucherHeader
        totalVouchers={vouchers.length}
        checkinCount={checkinCount}
        qrDataUrl={txQrDataUrl}
        copied={copied}
        onShare={handleShare}
      />

      {/* POS Check-in instruction banner */}
      <EVoucherCheckinNotice totalVouchers={vouchers.length} checkinCount={checkinCount} />

      {/* Vouchers List */}
      <EVoucherCardList vouchers={vouchers} />
    </div>
  );
}

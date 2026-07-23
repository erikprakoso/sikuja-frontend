'use client';

import React, { useState, useEffect, use } from 'react';
import QRCode from 'qrcode';
import { getStoredTransactions, getStoredVouchers, saveTransactions, saveVouchers, SIVOJA_EVENT_NAME } from '@/lib/storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Transaction, Voucher } from '@/types';
import {
  Ticket,
  QrCode,
  CheckCircle2,
  Trophy,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Share2,
  Flame,
} from 'lucide-react';

interface Props {
  params: Promise<{ token: string }>;
}

export default function ParticipantEVoucherPage({ params }: Props) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/vouchers/${token}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setTransaction(data.transaction);
        setVouchers(data.vouchers);

        // Generate QR for each voucher code
        (data.vouchers as Voucher[]).forEach((v) => {
          QRCode.toDataURL(v.code, { width: 200, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
            .then((url) => {
              setQrUrls((prev) => ({ ...prev, [v.code]: url }));
            })
            .catch(() => {});
        });
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

      txV.forEach((v) => {
        QRCode.toDataURL(v.code, { width: 200, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
          .then((url) => {
            setQrUrls((prev) => ({ ...prev, [v.code]: url }));
          })
          .catch(() => {});
      });
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
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-white">E-Voucher Tidak Ditemukan</h1>
        <p className="text-xs text-slate-400">
          Token transaksi <span className="font-mono text-red-400">{token}</span> tidak valid atau belum terdaftar.
        </p>
      </div>
    );
  }

  const checkinCount = vouchers.filter((v) => v.status !== 'terbit').length;

  return (
    <div className="max-w-xl mx-auto space-y-6 py-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-950 via-slate-900 to-red-900 border border-red-800/40 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          Bukti E-Voucher Digital 🇮🇩
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Kupon Jalan Sehat Agustusan
        </h1>

        <div className="flex items-center justify-center gap-3 text-xs text-slate-300">
          <span>Total: <strong className="text-white">{vouchers.length} Voucher</strong></span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">{checkinCount} Sudah Check-In Pos</span>
        </div>

        <div className="pt-2">
          <button
            onClick={handleShare}
            className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-red-700/50 text-red-300 text-xs font-bold inline-flex items-center gap-2 transition-all shadow-md"
          >
            <Share2 className="w-4 h-4" />
            {copied ? 'Link Tersalin!' : 'Bagikan / Simpan Bookmark Link ini'}
          </button>
        </div>
      </div>

      {/* POS Check-in instruction banner */}
      <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs space-y-1">
        <p className="font-bold flex items-center gap-1.5">
          📍 Petunjuk untuk Peserta di Pos Check-in:
        </p>
        <p className="text-[11px] text-amber-300/80 leading-relaxed">
          Tunjukkan halaman HP ini ke panitia di pos jalan sehat. Panitia cukup scan <strong>1x</strong> untuk mengaktifkan seluruh {vouchers.length} voucher milik Anda agar sah diundi!
        </p>
      </div>

      {/* Vouchers List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">
          Daftar Kode Voucher Anda ({vouchers.length})
        </h2>

        {vouchers.map((v, idx) => {
          let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
          let statusText = 'Belum Check-In Pos';

          if (v.status === 'checkin') {
            badgeColor = 'bg-emerald-950 border-emerald-700 text-emerald-300';
            statusText = '✓ Sah Ikut Undian';
          } else if (v.status === 'menang') {
            badgeColor = 'bg-amber-950 border-amber-600 text-amber-300 animate-pulse';
            statusText = `🏆 MENANG: ${v.prize_name || 'Hadiah'}`;
          } else if (v.status === 'diklaim') {
            badgeColor = 'bg-purple-950 border-purple-700 text-purple-300';
            statusText = '✓ Hadiah Sudah Diklaim';
          }

          return (
            <div
              key={v.code}
              className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-bold text-slate-500 font-mono">#Kupon {idx + 1}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${badgeColor}`}>
                    {statusText}
                  </span>
                </div>

                <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-widest bg-slate-950 py-2 px-4 rounded-2xl border border-slate-800 inline-block">
                  {v.code}
                </div>

                <p className="text-[11px] text-slate-400">
                  Tipe: <span className="font-semibold text-slate-200 capitalize">{v.type}</span>
                </p>
              </div>

              {/* QR Code thumbnail for each voucher */}
              {qrUrls[v.code] && (
                <div className="p-2 bg-white rounded-2xl shadow-md border-2 border-slate-800 flex-shrink-0">
                  <img src={qrUrls[v.code]} alt={`QR ${v.code}`} className="w-24 h-24 object-contain" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { createPurchaseTransaction } from '@/lib/services/voucher';
import { Transaction, Voucher } from '@/types';
import {
  Ticket,
  QrCode as QrIcon,
  Plus,
  Minus,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

export default function PenjualanPage() {
  const [qtyFisik, setQtyFisik] = useState(1);
  const [qtyNonFisik, setQtyNonFisik] = useState(0);
  const [lastTx, setLastTx] = useState<{ transaction: Transaction; vouchers: Voucher[] } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const totalLembar = qtyFisik + qtyNonFisik;
  const totalHarga = totalLembar * 5000;

  // Generate QR code image when a transaction is completed
  useEffect(() => {
    if (lastTx && lastTx.transaction.qty_non_fisik > 0) {
      const fullUrl = `${window.location.origin}/v/${lastTx.transaction.token}`;
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
  };

  const getEtokenUrl = () => {
    if (!lastTx) return '';
    return `${window.location.origin}/v/${lastTx.transaction.token}`;
  };

  const copyToClipboard = () => {
    const url = getEtokenUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
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
        <form onSubmit={handleCheckout} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Input Section */}
          <div className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-red-500" />
              Pilih Jumlah & Tipe Voucher
            </h2>

            {/* Voucher Fisik Input */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    📜 Voucher Fisik (Dicetak/Tulis Kertas)
                  </h3>
                  <p className="text-[11px] text-slate-400">Kode 5-digit disalin ke kertas voucher</p>
                </div>
                <span className="text-xs font-semibold text-slate-400">Rp5.000 / lbr</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setQtyFisik(Math.max(0, qtyFisik - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-2xl font-black text-white font-mono px-4">{qtyFisik}</span>
                <button
                  type="button"
                  onClick={() => setQtyFisik(qtyFisik + 1)}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Voucher Non-Fisik Input */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
                    📱 Voucher Non-Fisik (E-Voucher Digital)
                  </h3>
                  <p className="text-[11px] text-slate-400">Scan 1 QR transaksi via HP pembeli</p>
                </div>
                <span className="text-xs font-semibold text-slate-400">Rp5.000 / lbr</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setQtyNonFisik(Math.max(0, qtyNonFisik - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-2xl font-black text-cyan-300 font-mono px-4">{qtyNonFisik}</span>
                <button
                  type="button"
                  onClick={() => setQtyNonFisik(qtyNonFisik + 1)}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Batch Presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-400 font-semibold">Preset Cepat:</span>
              {[2, 5, 10, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setQtyFisik(num);
                    setQtyNonFisik(0);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  {num} Fisik
                </button>
              ))}
            </div>
          </div>

          {/* Right Summary & Action Box */}
          <div className="space-y-6 bg-gradient-to-br from-red-950/80 via-slate-900 to-slate-950 border border-red-900/60 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-lg font-extrabold text-white">Ringkasan Pembayaran</h2>
              
              <div className="space-y-2 border-y border-slate-800 py-4 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Jumlah Voucher Fisik:</span>
                  <span className="font-bold text-white">{qtyFisik} lembar</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Jumlah E-Voucher Digital:</span>
                  <span className="font-bold text-cyan-300">{qtyNonFisik} lembar</span>
                </div>
                <div className="flex justify-between text-slate-300 pt-2 border-t border-slate-800/60">
                  <span className="font-bold text-white">Total Kuantitas:</span>
                  <span className="font-black text-red-400">{totalLembar} lembar</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-red-900/40 text-center space-y-1">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Total Tagihan Tunai</span>
                <p className="text-3xl font-black text-amber-400 font-mono">
                  Rp {totalHarga.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={totalLembar <= 0}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white font-black text-lg shadow-xl shadow-red-950/80 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Proses & Terbitkan Kode
            </button>
          </div>
        </form>
      ) : (
        /* Transaction Result View */
        <div className="space-y-8 animate-fade-in">
          <div className="bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-emerald-400">
              <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-black text-white">Transaksi Berhasil Diterbitkan!</h2>
                <p className="text-xs text-slate-400">
                  Total {lastTx.transaction.qty_fisik + lastTx.transaction.qty_non_fisik} voucher • Rp {lastTx.transaction.total_harga.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* E-Voucher QR Section */}
              {lastTx.transaction.qty_non_fisik > 0 && (
                <div className="bg-slate-950 border border-cyan-500/30 rounded-2xl p-6 text-center space-y-4 flex flex-col items-center justify-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-bold">
                    <QrIcon className="w-3.5 h-3.5" />
                    1 QR Transaksi E-Voucher
                  </div>
                  <p className="text-xs text-slate-300">
                    Minta pembeli <strong>scan QR di bawah 1x saja</strong> pakai kamera HP (tanpa app/tanpa login) untuk membuka {lastTx.transaction.qty_non_fisik} e-voucher milik mereka.
                  </p>

                  {qrDataUrl && (
                    <div className="p-3 bg-white rounded-2xl shadow-lg inline-block border-4 border-cyan-400">
                      <img src={qrDataUrl} alt="E-Voucher QR Code" className="w-56 h-56 object-contain" />
                    </div>
                  )}

                  <div className="flex items-center gap-2 w-full max-w-sm">
                    <button
                      onClick={copyToClipboard}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                    >
                      <Copy className="w-4 h-4 text-cyan-400" />
                      {copied ? 'Tersalin!' : 'Salin Link E-Voucher'}
                    </button>

                    <a
                      href={getEtokenUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 transition-colors"
                      title="Buka Pratinjau E-Voucher"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}

              {/* Physical Vouchers List Section */}
              {lastTx.transaction.qty_fisik > 0 && (
                <div className="bg-slate-950 border border-red-900/40 rounded-2xl p-6 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950 border border-red-800 text-red-300 text-xs font-bold">
                    <Ticket className="w-3.5 h-3.5" />
                    {lastTx.transaction.qty_fisik} Kode Voucher Fisik (Salin ke Kertas)
                  </div>
                  <p className="text-xs text-slate-400">
                    Tuliskan/cocokkan kode 5-digit angka murni di bawah ke lembar kertas fisik yang dipegang peserta:
                  </p>

                  <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                    {lastTx.vouchers
                      .filter((v) => v.type === 'fisik')
                      .map((v, idx) => (
                        <div
                          key={v.code}
                          className="p-3 bg-slate-900 border border-red-800/40 rounded-xl text-center shadow-inner"
                        >
                          <span className="text-[10px] text-slate-500 font-mono block">#Fisik {idx + 1}</span>
                          <span className="text-2xl font-black text-red-400 font-mono tracking-widest block">
                            {v.code}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleResetForm}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-sm shadow-lg shadow-red-950/60 transition-all hover:scale-105"
              >
                + Transaksi Penjualan Selanjutnya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

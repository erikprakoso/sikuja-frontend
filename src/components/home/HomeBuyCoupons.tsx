'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Store, MessageCircle, ArrowRight, Ticket, Smartphone, Banknote, QrCode } from 'lucide-react';
import { isWhatsAppConfigured, getWhatsAppOrderUrl } from '@/lib/services/whatsapp';
import { getSavedStaticQris } from '@/lib/services/qris';

export const HomeBuyCoupons: React.FC = () => {
  const waUrl = getWhatsAppOrderUrl();
  const hasWhatsApp = isWhatsAppConfigured();
  const [qrisDataUrl, setQrisDataUrl] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const payload = getSavedStaticQris();
      if (!payload) return;
      try {
        const url = await QRCode.toDataURL(payload, {
          width: 280,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        });
        if (!cancelled) setQrisDataUrl(url);
      } catch (err) {
        console.error('QRIS Gen error:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasQris = Boolean(qrisDataUrl);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-xl bg-[#E70013] text-white flex items-center justify-center shadow-xs">
          <Store className="w-4 h-4" />
        </span>
        <h2 className="text-lg font-black text-slate-900">Cara Beli Kupon</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. Kupon Fisik di Counter */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <Ticket className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black text-slate-900">Kupon Fisik di Counter</h3>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Beli langsung di <b>counter penjualan panitia</b> dengan harga{' '}
            <b>Rp5.000 / kupon</b>. Pembayaran bisa{' '}
            <span className="inline-flex items-center gap-1 font-bold">
              <Banknote className="w-3.5 h-3.5" /> Tunai
            </span>{' '}
            atau{' '}
            <span className="inline-flex items-center gap-1 font-bold">
              <QrCode className="w-3.5 h-3.5" /> Scan QRIS
            </span>{' '}
            di lokasi.
          </p>
        </div>

        {/* 2. E-Voucher via WhatsApp */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black text-slate-900">E-Voucher via WhatsApp</h3>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Pesan online dari rumah, bayar via <b>QRIS / transfer</b>, lalu E-Voucher
            digital dikirim ke HP Anda. Di hari H tinggal tunjukkan kartu E-Voucher
            untuk di-scan.
          </p>
          {hasWhatsApp ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              Pesan Via WhatsApp
              <ArrowRight className="w-4 h-4" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200">
              <MessageCircle className="w-4 h-4" />
              Nomor WhatsApp segera diumumkan
            </span>
          )}
        </div>
      </div>

      {/* 3. QRIS Payment (scan langsung) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center gap-5">
        <div className="flex-1 space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 text-sm font-black text-slate-900">
            <span className="p-1.5 rounded-lg bg-[#E70013] text-white">
              <QrCode className="w-4 h-4" />
            </span>
            Pembayaran QRIS
          </div>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Scan kode QRIS di samping dengan aplikasi e-wallet / m-banking Anda,
            lalu masukkan nominal sesuai jumlah kupon yang dibeli
            (Rp5.000 × jumlah kupon).
          </p>
          <p className="text-[11px] text-slate-500 font-semibold">
            Berlaku untuk pembelian di counter maupun pesanan E-Voucher.
          </p>
        </div>

        {hasQris ? (
          <div className="shrink-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
            <img
              src={qrisDataUrl}
              alt="Kode QRIS Pembayaran"
              className="w-44 h-44 sm:w-48 sm:h-48 object-contain"
            />
            <p className="mt-1.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Scan untuk bayar
            </p>
          </div>
        ) : (
          <span className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200">
            Kode QRIS segera tersedia
          </span>
        )}
      </div>
    </section>
  );
};

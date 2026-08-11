'use client';

import React from 'react';
import { Store, Ticket, Smartphone, Banknote, QrCode } from 'lucide-react';

export const HomeBuyCoupons: React.FC = () => {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-xl bg-[#E70013] text-white flex items-center justify-center shadow-xs">
          <Store className="w-4 h-4" />
        </span>
        <h2 className="text-lg font-black text-slate-900">Cara Beli Kupon</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. Kupon Fisik */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kupon Fisik</span>
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">Rp5.000 <span className="text-xs font-semibold text-slate-500">/ kupon</span></p>
          <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2">
            Kupon dijual oleh panitia yang mendatangi rumah warga. Pembayaran dilakukan{' '}
            <span className="inline-flex items-center gap-1 font-bold"><Banknote className="w-3.5 h-3.5" /> Tunai</span>{' '}
            atau{' '}
            <span className="inline-flex items-center gap-1 font-bold"><QrCode className="w-3.5 h-3.5" /> QRIS</span>{' '}
            di tempat.
          </p>
          <p className="text-[11px] font-bold text-slate-500 mt-2">Penjualan tidak dilakukan di lokasi acara pada hari H.</p>
        </div>

        {/* 2. E-Voucher via WhatsApp */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">E-Voucher</span>
            <div className="p-2 rounded-xl bg-emerald-600 text-white">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">Rp5.000 <span className="text-xs font-semibold text-slate-500">/ kupon</span></p>
          <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2">
            Pemesanan dilakukan secara online, pembayaran melalui QRIS atau transfer bank,
            dan E-Voucher digital dikirim ke HP.
          </p>
          <p className="text-[11px] font-bold text-slate-500 mt-3">Pesan melalui tombol WhatsApp di pojok bawah layar.</p>
          <p className="text-[11px] font-bold text-slate-500 mt-1">Penjualan tidak dilakukan pada hari H.</p>
        </div>
      </div>
    </section>
  );
};

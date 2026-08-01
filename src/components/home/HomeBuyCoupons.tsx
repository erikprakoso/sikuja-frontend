import React from 'react';
import { Store, MessageCircle, ArrowRight, Ticket, Smartphone } from 'lucide-react';
import { isWhatsAppConfigured, getWhatsAppOrderUrl } from '@/lib/services/whatsapp';

export const HomeBuyCoupons: React.FC = () => {
  const waUrl = getWhatsAppOrderUrl();
  const hasWhatsApp = isWhatsAppConfigured();

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
            <b>Rp5.000 / kupon</b> (bayar tunai). Kupon fisik langsung dibawa untuk
            check-in di pos pada hari H.
          </p>
        </div>

        {/* 2. E-Voucher via WhatsApp */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black text-slate-900">E-Voucher via WhatsApp</h3>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Pesan online dari rumah — bayar via transfer, E-Voucher digital dikirim ke
            HP Anda. Di hari H tinggal tunjukkan kartu E-Voucher untuk di-scan.
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
    </section>
  );
};

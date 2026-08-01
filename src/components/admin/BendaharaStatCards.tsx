import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, Wallet, ReceiptText } from 'lucide-react';
import { SIKUJA_EVENT_NAME, getStoredVouchers } from '@/lib/storage';

export const BendaharaStatCards = () => {
  const [totalDonasi, setTotalDonasi] = useState(0);
  const [totalPembelian, setTotalPembelian] = useState(0);
  const [totalSales, setTotalSales] = useState(0);

  const loadData = async () => {
    try {
      // 1. Fetch Donasi / Pemasukan
      const donRes = await fetch('/api/keuangan/donasi');
      const donData = await donRes.json();
      if (donRes.ok && donData.donations) {
        const sum = donData.donations.reduce((acc: number, d: any) => acc + d.amount, 0);
        setTotalDonasi(sum);
      }

      // 2. Fetch Pembelian / Pengeluaran
      const purRes = await fetch('/api/keuangan/purchases');
      const purData = await purRes.json();
      if (purRes.ok && purData.purchases) {
        const sum = purData.purchases.reduce((acc: number, p: any) => acc + p.total_price, 0);
        setTotalPembelian(sum);
      }

      // 3. Vouchers sales revenue
      const vouchers = getStoredVouchers();
      setTotalSales(vouchers.length * 5000);
    } catch (err) {
      console.error('Fetch stat cards error:', err);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener(SIKUJA_EVENT_NAME, loadData);
    return () => window.removeEventListener(SIKUJA_EVENT_NAME, loadData);
  }, []);

  const saldoKas = totalDonasi + totalSales - totalPembelian;

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Pemasukan & Sponsor */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Pemasukan & Sponsor</p>
            <p className="text-xl font-black text-emerald-700">{formatRupiah(totalDonasi)}</p>
          </div>
        </div>
      </div>

      {/* Hasil Penjualan Kupon */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-100 text-indigo-700">
            <ReceiptText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Hasil Penjualan Kupon</p>
            <p className="text-xl font-black text-indigo-700">{formatRupiah(totalSales)}</p>
          </div>
        </div>
      </div>

      {/* Pengeluaran & Belanja */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-100 text-blue-700">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Pengeluaran & Belanja</p>
            <p className="text-xl font-black text-blue-700">{formatRupiah(totalPembelian)}</p>
          </div>
        </div>
      </div>

      {/* Saldo Kas Bersih */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-[#E70013] text-white">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Saldo Kas Bersih</p>
            <p className={`text-xl font-black ${saldoKas < 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {formatRupiah(saldoKas)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

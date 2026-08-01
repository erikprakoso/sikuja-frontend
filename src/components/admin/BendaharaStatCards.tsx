import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export const BendaharaStatCards = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">Total Donasi</p>
            <p className="text-2xl font-black text-emerald-700">Rp0</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-100 text-blue-700">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">Pembelian Doorprize</p>
            <p className="text-2xl font-black text-blue-700">Rp0</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-100 text-amber-700">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">Total Pengeluaran</p>
            <p className="text-2xl font-black text-amber-700">Rp0</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#E70013] text-white">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">Saldo Bersih</p>
            <p className="text-2xl font-black text-slate-900">Rp0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

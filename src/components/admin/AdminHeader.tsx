import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const AdminHeader: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950 border border-purple-800 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          Dashboard Administrasi & Laporan
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Laporan & Rekapitulasi Penjualan</h1>
        <p className="text-xs text-slate-400">
          Ringkasan real-time penjualan voucher, pengelolaan daftar doorprize, dan status peserta.
        </p>
      </div>
    </div>
  );
};

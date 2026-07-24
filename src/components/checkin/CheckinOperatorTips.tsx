import React from 'react';
import { Zap } from 'lucide-react';

export const CheckinOperatorTips: React.FC = () => {
  return (
    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
      <span className="font-bold text-slate-200 flex items-center gap-1.5">
        <Zap className="w-4 h-4 text-emerald-400" />
        Tips Panitia Pos:
      </span>
      <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
        <li>1 transaksi e-voucher cukup discan 1x untuk langsung mengaktifkan semua kuponnya sekaligus.</li>
        <li>Beberapa panitia dapat membuka halaman ini bersamaan di HP masing-masing tanpa risiko scan ganda.</li>
        <li>Data tersinkronkan real-time. Kode yang belum check-in tidak akan ditarik saat undian.</li>
      </ul>
    </div>
  );
};

import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const CheckinOperatorTips: React.FC = () => {
  return (
    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
      <span className="font-bold text-slate-200 flex items-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        Panduan Operasional Panitia:
      </span>
      <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed">
        <li>Pemindaian 1 QR Code E-Voucher secara otomatis mengonfirmasi seluruh kupon dalam transaksi tersebut.</li>
        <li>Sistem mendukung verifikasi bersamaan oleh beberapa petugas tanpa risiko duplikasi data.</li>
        <li>Seluruh data terekam secara real-time. Hanya kupon yang telah terverifikasi yang masuk ke dalam sistem undian.</li>
      </ul>
    </div>
  );
};

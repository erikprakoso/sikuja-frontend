import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const CheckinOperatorTips: React.FC = () => {
  return (
    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 space-y-2.5 shadow-xs">
      <span className="font-bold flex items-center gap-1.5 text-sm text-slate-900">
        <ShieldCheck className="w-4 h-4 text-[#E70013]" />
        Panduan Operasional Panitia:
      </span>
      <ul className="list-disc list-inside space-y-1 text-[11px] font-medium text-slate-600 leading-relaxed">
        <li>Utamakan <b>cari berdasarkan nama pembeli atau no. HP</b>, lalu pilih peserta yang tepat sebelum verifikasi.</li>
        <li>Jika hasil pencarian lebih dari satu, <b>pilih dulu</b> transaksi mana yang benar-benar perlu diverifikasi.</li>
        <li>Pemindaian <b>1 QR Code E-Voucher</b> otomatis mengonfirmasi seluruh kupon milik transaksi tersebut.</li>
        <li>Sistem mendukung verifikasi bersamaan oleh beberapa petugas tanpa risiko duplikasi data.</li>
        <li>Seluruh data terekam secara real-time. Hanya kupon yang telah terverifikasi yang masuk ke dalam sistem undian.</li>
      </ul>
    </div>
  );
};

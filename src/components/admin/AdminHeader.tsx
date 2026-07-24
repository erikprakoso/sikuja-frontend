import React from 'react';
import { ShieldCheck, Printer, Download } from 'lucide-react';

interface AdminHeaderProps {
  onPrint: () => void;
  onExportCSV: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onPrint, onExportCSV }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950 border border-purple-800 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          Dashboard Admin & Rekapitulasi
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Laporan & Manajemen Event</h1>
        <p className="text-xs text-slate-400">
          Rekap otomatis penjualan, kelola daftar hadiah, dan unduh laporan CSV.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onPrint}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 transition-all border border-slate-700"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          🖨️ Cetak Lembaran Kupon
        </button>
        <button
          onClick={onExportCSV}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md"
        >
          <Download className="w-4 h-4" />
          Unduh Rekap (CSV)
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export const VerifikasiHeader: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Verifikasi Klaim Panggung
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Validasi Kode Pemenang</h1>
        <p className="text-xs text-slate-400">
          Cocokkan voucher pemenang yang maju ke panggung dan tandai "diklaim" (pengganti sobek kertas).
        </p>
      </div>
    </div>
  );
};

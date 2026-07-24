import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export const VerifikasiHeader: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Pos Verifikasi Hadiah
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Verifikasi & Klaim Hadiah</h1>
        <p className="text-xs text-slate-400">
          Layanan validasi kode kupon pemenang dan pencatatan serah terima hadiah.
        </p>
      </div>
    </div>
  );
};

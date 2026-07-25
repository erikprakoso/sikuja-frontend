import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export const VerifikasiHeader: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-4 border-[#E70013]">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E70013] text-white text-xs font-black uppercase tracking-wider mb-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Pos Verifikasi Hadiah
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#E70013]">Verifikasi & Klaim Hadiah</h1>
        <p className="text-xs text-[#E70013] font-bold">
          Layanan validasi kode kupon pemenang dan pencatatan serah terima hadiah.
        </p>
      </div>
    </div>
  );
};

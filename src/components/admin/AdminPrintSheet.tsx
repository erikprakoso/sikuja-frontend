import React from 'react';
import { Voucher } from '@/types';

interface AdminPrintSheetProps {
  vouchers: Voucher[];
}

export const AdminPrintSheet: React.FC<AdminPrintSheetProps> = ({ vouchers }) => {
  return (
    <div className="hidden print-area text-black font-sans">
      <div className="text-center pb-3 border-b-2 border-black mb-4">
        <h1 className="text-xl font-black uppercase">LEMBARAN KUPON VOUCHER JALAN SEHAT AGUSTUSAN 🇮🇩</h1>
        <p className="text-xs font-bold">Total Terbit: {vouchers.length} Lembar Kode Voucher</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {vouchers.map((v, idx) => (
          <div key={v.code} className="border-2 border-black p-3 text-center rounded-lg space-y-1">
            <div className="flex justify-between items-center text-[9px] font-bold border-b border-black pb-1">
              <span>SIKUJA 2026</span>
              <span className="uppercase">{v.type}</span>
            </div>
            <p className="text-[10px] font-bold mt-1">KODE VOUCHER #{idx + 1}</p>
            <div className="text-2xl font-black font-mono tracking-widest my-1">{v.code}</div>
            <p className="text-[8px] text-gray-700">Wajib Di-scan di Pos Rute Jalan Sehat</p>
          </div>
        ))}
      </div>
    </div>
  );
};

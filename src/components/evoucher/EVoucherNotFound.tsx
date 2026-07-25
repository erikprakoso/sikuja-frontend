import React from 'react';
import { AlertCircle } from 'lucide-react';

interface EVoucherNotFoundProps {
  token: string;
}

export const EVoucherNotFound: React.FC<EVoucherNotFoundProps> = ({ token }) => {
  return (
    <div className="max-w-md mx-auto py-16 text-center space-y-4">
      <div className="w-16 h-16 mx-auto rounded-full bg-[#E70013] text-white flex items-center justify-center shadow-md">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-xl font-black text-[#E70013]">E-Voucher Tidak Ditemukan</h1>
      <p className="text-xs font-semibold text-[#E70013]/70">
        Kode token transaksi <span className="font-mono font-bold text-[#E70013] underline">{token}</span> tidak terdaftar dalam sistem.
      </p>
    </div>
  );
};

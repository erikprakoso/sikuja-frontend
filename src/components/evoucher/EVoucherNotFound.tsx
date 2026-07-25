import React from 'react';
import { AlertCircle } from 'lucide-react';

interface EVoucherNotFoundProps {
  token: string;
}

export const EVoucherNotFound: React.FC<EVoucherNotFoundProps> = ({ token }) => {
  return (
    <div className="max-w-md mx-auto py-16 text-center space-y-4">
      <div className="w-16 h-16 mx-auto rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-xl font-black text-slate-900">E-Voucher Tidak Ditemukan</h1>
      <p className="text-xs font-medium text-slate-600">
        Kode token transaksi <span className="font-mono font-bold text-slate-900 underline">{token}</span> tidak terdaftar dalam sistem.
      </p>
    </div>
  );
};

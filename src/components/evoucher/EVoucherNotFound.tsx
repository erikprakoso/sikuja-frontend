import React from 'react';
import { AlertCircle } from 'lucide-react';

interface EVoucherNotFoundProps {
  token: string;
}

export const EVoucherNotFound: React.FC<EVoucherNotFoundProps> = ({ token }) => {
  return (
    <div className="max-w-md mx-auto py-16 text-center space-y-4">
      <div className="w-16 h-16 mx-auto rounded-full bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-xl font-black text-white">E-Voucher Tidak Ditemukan</h1>
      <p className="text-xs text-slate-400">
        Token transaksi <span className="font-mono text-red-400">{token}</span> tidak valid atau belum terdaftar.
      </p>
    </div>
  );
};

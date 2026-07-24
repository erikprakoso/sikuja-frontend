import React from 'react';
import { Lock } from 'lucide-react';

export const LoginHeader: React.FC = () => {
  return (
    <div className="text-center space-y-2">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center shadow-lg shadow-red-900/50">
        <Lock className="w-7 h-7 text-white" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-white">Login Peran Panitia</h1>
      <p className="text-xs text-slate-400">
        Masukkan 4-digit PIN khusus sesuai peran operasional Anda.
      </p>
    </div>
  );
};

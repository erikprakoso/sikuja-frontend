import React from 'react';
import { Lock } from 'lucide-react';

export const LoginHeader: React.FC = () => {
  return (
    <div className="text-center space-y-2">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E70013] text-white flex items-center justify-center shadow-md">
        <Lock className="w-7 h-7" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-[#E70013]">Login Peran Panitia</h1>
      <p className="text-xs text-[#E70013] font-bold">
        Masukkan 4-digit PIN khusus sesuai peran operasional Anda.
      </p>
    </div>
  );
};

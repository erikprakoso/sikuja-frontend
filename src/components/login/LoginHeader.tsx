import React from 'react';
import { Lock } from 'lucide-react';

export const LoginHeader: React.FC<{ pinLength?: number }> = ({ pinLength = 6 }) => {
  return (
    <div className="text-center space-y-2">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-[#E70013] text-white flex items-center justify-center shadow-xs">
        <Lock className="w-6 h-6" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Login Peran Panitia</h1>
      <p className="text-xs text-slate-600 font-medium">
        Masukkan PIN {pinLength}-digit khusus sesuai peran operasional Anda.
      </p>
    </div>
  );
};

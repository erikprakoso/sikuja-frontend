import React from 'react';
import { KeyRound } from 'lucide-react';

export const PinCheatSheet: React.FC = () => {
  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
      <span className="font-bold text-slate-200 flex items-center gap-1.5">
        <KeyRound className="w-4 h-4 text-amber-400" />
        Panduan PIN Panitia:
      </span>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
          <span className="font-bold text-red-400 font-mono">1111</span>: Penjualan
        </div>
        <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
          <span className="font-bold text-emerald-400 font-mono">2222</span>: Pos Check-In
        </div>
        <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
          <span className="font-bold text-amber-400 font-mono">3333</span>: MC Undian
        </div>
        <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
          <span className="font-bold text-cyan-400 font-mono">4444</span>: Verifikasi
        </div>
        <div className="p-2 rounded bg-slate-950/60 border border-slate-800 col-span-2">
          <span className="font-bold text-purple-400 font-mono">9999</span>: Admin / Ketua
        </div>
      </div>
    </div>
  );
};

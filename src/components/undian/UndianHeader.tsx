import React from 'react';
import { Trophy, Users, Maximize } from 'lucide-react';

interface UndianHeaderProps {
  eligibleCount: number;
  onToggleFullscreen: () => void;
}

export const UndianHeader: React.FC<UndianHeaderProps> = ({
  eligibleCount,
  onToggleFullscreen,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950 border border-amber-700 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
          <Trophy className="w-3.5 h-3.5" />
          Layar Undian Panggung Utama
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Pengocokan Kode Acak</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-right">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Peserta Eligible</span>
          <span className="text-lg font-black text-emerald-400 font-mono flex items-center gap-1">
            <Users className="w-4 h-4 inline" /> {eligibleCount} Kode
          </span>
        </div>

        <button
          onClick={onToggleFullscreen}
          className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
          title="Layar Penuh Proyektor"
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

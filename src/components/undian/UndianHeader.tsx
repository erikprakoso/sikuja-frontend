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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E70013] text-white text-xs font-bold uppercase tracking-wider mb-2">
          <Trophy className="w-3.5 h-3.5" />
          Panggung Utama
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Pengundian Doorprize</h1>
        <p className="text-xs text-slate-600 font-medium mt-0.5">
          Tampilan pengundian doorprize layar penuh untuk panggung utama event.
        </p>
      </div>

      <div className="flex items-center gap-2.5 self-end sm:self-auto">
        {/* Live participant count */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center sm:text-right shadow-xs flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E70013] opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E70013]" />
          </span>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Peserta Sah Undian</span>
            <p className="text-xl font-black text-slate-900 font-mono mt-0.5 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#E70013]" />
              {eligibleCount} <span className="text-xs font-bold text-slate-500">Kupon</span>
            </p>
          </div>
        </div>

        {/* Fullscreen toggle */}
        <button
          onClick={onToggleFullscreen}
          className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-[#E70013] hover:border-[#E70013] transition-all cursor-pointer active:scale-95 shadow-xs"
          title="Mode Tampilan Penuh"
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

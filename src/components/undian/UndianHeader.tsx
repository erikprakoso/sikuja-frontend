import React from 'react';
import { Users, Layers, Maximize } from 'lucide-react';

interface UndianHeaderProps {
  eligibleCount: number;
  poolSize?: number | null;
  onToggleFullscreen: () => void;
}

export const UndianHeader: React.FC<UndianHeaderProps> = ({
  eligibleCount,
  poolSize,
  onToggleFullscreen,
}) => {
  return (
    <div className="flex items-center justify-end gap-4 pb-2 border-b border-slate-200">
      <div className="flex items-center gap-2">
        <Users className="w-3.5 h-3.5 text-slate-400" />
        <div className="text-right">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Peserta Sah Undian
          </p>
          <p className="text-base font-bold text-slate-900 font-mono leading-tight">
            {eligibleCount}
          </p>
        </div>
      </div>

      <div className="w-px h-6 bg-slate-200" />

      <div className="flex items-center gap-2">
        <Layers className="w-3.5 h-3.5 text-slate-400" />
        <div className="text-right">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Pool Undian Terakhir
          </p>
          <p className="text-base font-bold text-slate-900 font-mono leading-tight">
            {poolSize !== null && poolSize !== undefined ? poolSize : '—'}
          </p>
        </div>
      </div>

      <button
        onClick={onToggleFullscreen}
        className="p-1.5 rounded-lg text-slate-500 hover:text-[#E70013] hover:bg-[#E70013]/5 transition-colors cursor-pointer"
        title="Mode Tampilan Penuh"
      >
        <Maximize className="w-4 h-4" />
      </button>
    </div>
  );
};

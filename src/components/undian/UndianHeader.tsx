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
    <div className="flex items-center justify-end gap-4 pb-3 border-b-2 border-zinc-700">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-yellow-400" />
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
            Peserta Sah Undian
          </p>
          <p className="text-base font-black text-white font-mono leading-tight">
            {eligibleCount}
          </p>
        </div>
      </div>

      <div className="w-px h-6 bg-zinc-600" />

      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-yellow-400" />
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
            Pool Undian Terakhir
          </p>
          <p className="text-base font-black text-white font-mono leading-tight">
            {poolSize !== null && poolSize !== undefined ? poolSize : '—'}
          </p>
        </div>
      </div>

      <button
        onClick={onToggleFullscreen}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-yellow-400 hover:bg-white/10 border border-transparent hover:border-zinc-600 transition-colors cursor-pointer"
        title="Mode Tampilan Penuh"
      >
        <Maximize className="w-4 h-4" />
      </button>
    </div>
  );
};

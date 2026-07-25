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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {/* Stage badge */}
        <div className="w-12 h-12 rounded-2xl bg-[#E70013] flex items-center justify-center shadow-md flex-shrink-0">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-[10px] font-black text-[#E70013]/60 uppercase tracking-widest mb-0.5">
            Panggung Utama
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-[#E70013] leading-tight">
            Pengundian Doorprize
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5 self-end sm:self-auto">
        {/* Live participant count */}
        <div className="flex items-center gap-2.5 bg-white border-2 border-[#E70013] rounded-2xl px-4 py-2.5 shadow-sm">
          {/* Live dot */}
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E70013] opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E70013]" />
          </span>
          <div>
            <p className="text-[9px] text-[#E70013]/60 font-black uppercase tracking-widest leading-none mb-0.5">
              Peserta Eligible
            </p>
            <p className="text-lg font-black text-[#E70013] font-mono flex items-center gap-1.5 leading-none">
              <Users className="w-4 h-4 inline" />
              {eligibleCount} Kupon
            </p>
          </div>
        </div>

        {/* Fullscreen toggle */}
        <button
          onClick={onToggleFullscreen}
          className="p-3 rounded-2xl bg-[#E70013] text-white hover:bg-[#E70013]/90 transition-all cursor-pointer active:scale-95 shadow-md"
          title="Mode Tampilan Penuh"
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

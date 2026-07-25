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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b-4 border-[#E70013]">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E70013] text-white text-xs font-black uppercase tracking-wider mb-2">
          <Trophy className="w-3.5 h-3.5" />
          Panggung Utama Pengundian
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#E70013]">Pengundian Doorprize</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-white border-4 border-[#E70013] rounded-2xl px-4 py-2 text-right shadow-sm">
          <span className="text-[10px] text-[#E70013] font-black uppercase block">Peserta Terverifikasi</span>
          <span className="text-lg font-black text-[#E70013] font-mono flex items-center gap-1">
            <Users className="w-4 h-4 inline" /> {eligibleCount} Kupon
          </span>
        </div>

        <button
          onClick={onToggleFullscreen}
          className="p-3 rounded-2xl bg-[#E70013] text-white border-2 border-[#E70013] hover:bg-[#E70013]/90 transition-all cursor-pointer active:scale-95 shadow"
          title="Mode Tampilan Penuh"
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { Prize } from '@/types';
import { Star, CheckCircle } from 'lucide-react';

interface PrizeSelectorGridProps {
  prizes: Prize[];
  selectedPrizeId: string;
  isRolling: boolean;
  onSelectPrize: (prizeId: string) => void;
}

export const PrizeSelectorGrid: React.FC<PrizeSelectorGridProps> = ({
  prizes,
  selectedPrizeId,
  isRolling,
  onSelectPrize,
}) => {
  const availablePrizes = prizes.filter((p) => p.drawn_count < p.stock);

  if (availablePrizes.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-[#E70013] text-white text-center font-black flex items-center justify-center gap-2 border-2 border-[#E70013]">
        <CheckCircle className="w-5 h-5 text-white" />
        Seluruh Pengundian Hadiah telah Selesai 🏆
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="text-xs font-black uppercase tracking-wider text-[#E70013] flex items-center gap-1.5">
        <Star className="w-4 h-4 text-[#E70013]" />
        Pilih Kategori Hadiah ({availablePrizes.length} Tersedia):
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {availablePrizes.map((p) => {
          const isSelected = p.id === selectedPrizeId;
          return (
            <button
              key={p.id}
              disabled={isRolling}
              onClick={() => onSelectPrize(p.id)}
              className={`p-3 rounded-2xl text-left border-2 transition-all relative overflow-hidden cursor-pointer active:scale-95 disabled:cursor-not-allowed ${
                isSelected
                  ? 'bg-[#E70013] border-[#E70013] text-white shadow-lg font-black'
                  : 'bg-white border-[#E70013] text-[#E70013] hover:bg-[#E70013]/10 font-bold'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-[10px] uppercase font-black ${isSelected ? 'text-white' : 'text-[#E70013]'}`}>
                  Kategori #{p.order_num}
                </span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${isSelected ? 'bg-white text-[#E70013] border-white' : 'bg-[#E70013] text-white border-[#E70013]'}`}>
                  {p.drawn_count}/{p.stock}
                </span>
              </div>
              <p className="text-xs font-black truncate mt-1">{p.name}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

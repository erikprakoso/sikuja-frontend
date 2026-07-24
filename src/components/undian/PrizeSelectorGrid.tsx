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
  // Hide prizes that are fully drawn (stok habis)
  const availablePrizes = prizes.filter((p) => p.drawn_count < p.stock);

  if (availablePrizes.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-center font-bold flex items-center justify-center gap-2">
        <CheckCircle className="w-5 h-5 text-emerald-400" />
        Semua Hadiah Telah Selesai Diundi! 🏆
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <Star className="w-4 h-4 text-amber-400" />
        Pilih Hadiah yang Akan Diundi ({availablePrizes.length} Tersedia):
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {availablePrizes.map((p) => {
          const isSelected = p.id === selectedPrizeId;
          return (
            <button
              key={p.id}
              disabled={isRolling}
              onClick={() => onSelectPrize(p.id)}
              className={`p-3 rounded-2xl text-left border transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-amber-950/80 border-amber-500 text-white shadow-lg shadow-amber-950/60 scale-105 ring-2 ring-amber-400/40'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold text-amber-400">#Hadiah {p.order_num}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
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

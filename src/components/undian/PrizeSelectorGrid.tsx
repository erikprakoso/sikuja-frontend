import React from 'react';
import { Prize } from '@/types';
import { Star, CheckCircle, XCircle } from 'lucide-react';
import { sortPrizesByUnitPrice } from '@/lib/storage';

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
  const sortedPrizes = sortPrizesByUnitPrice(prizes).map((p, i) => ({
    ...p,
    order_num: i + 1,
  }));

  if (prizes.length === 0) {
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-3 max-h-64 sm:max-h-72 lg:max-h-56 xl:max-h-48 overflow-y-auto pr-1 pb-2">
        {sortedPrizes.map((p) => {
          const isAvailable = p.drawn_count < p.stock;
          const isSelected = isAvailable && p.id === selectedPrizeId;

          if (!isAvailable) {
            return (
              <div
                key={p.id}
                className="p-3 rounded-2xl text-left border-2 border-slate-200 bg-slate-100 text-slate-400 relative overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-black text-slate-400">
                    Kategori #{p.order_num}
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded border border-slate-300 bg-white text-slate-500">
                    {p.drawn_count}/{p.stock}
                  </span>
                </div>
                <p className="text-xs font-black truncate mt-1">{p.name}</p>
                <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-500">
                  <XCircle className="w-3 h-3" />
                  Stok Habis
                </span>
              </div>
            );
          }

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

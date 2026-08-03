import React, { useEffect, useRef } from 'react';
import { Prize } from '@/types';
import { Star, CheckCircle } from 'lucide-react';
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
  const availablePrizes = sortPrizesByUnitPrice(prizes)
    .filter((p) => p.drawn_count < p.stock)
    .map((p, i) => ({ ...p, order_num: i + 1 }));

  const listRef = useRef<HTMLDivElement>(null);
  const prevAvailableCount = useRef<number>(availablePrizes.length);

  // Setiap kali ada stok kategori yang habis (jumlah tersedia berkurang),
  // otomatis kembali ke atas daftar agar kategori yang akan diundi selalu terlihat.
  useEffect(() => {
    const count = availablePrizes.length;
    if (count < prevAvailableCount.current) {
      listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
    prevAvailableCount.current = count;
  }, [availablePrizes.length]);

  if (prizes.length === 0 || availablePrizes.length === 0) {
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
      <div
        ref={listRef}
        className="flex flex-col gap-1.5 max-h-64 sm:max-h-72 lg:max-h-[calc(100vh-7rem)] overflow-y-auto pr-1 pb-2"
      >
        {availablePrizes.map((p) => {
          const isSelected = p.id === selectedPrizeId;
          return (
            <button
              key={p.id}
              disabled={isRolling}
              onClick={() => onSelectPrize(p.id)}
              className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-xl border-2 transition-all text-left cursor-pointer active:scale-[0.99] disabled:cursor-not-allowed ${
                isSelected
                  ? 'bg-[#E70013] border-[#E70013] text-white shadow-lg font-black'
                  : 'bg-white border-[#E70013] text-[#E70013] hover:bg-[#E70013]/10 font-bold'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className={`text-[10px] uppercase font-black ${isSelected ? 'text-white' : 'text-[#E70013]'}`}>
                  #{p.order_num}
                </span>
                <span className="text-xs font-black truncate">{p.name}</span>
              </span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded border flex-shrink-0 ${
                  isSelected ? 'bg-white text-[#E70013] border-white' : 'bg-[#E70013] text-white border-[#E70013]'
                }`}
              >
                {p.drawn_count}/{p.stock}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

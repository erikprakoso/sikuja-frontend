import React from 'react';
import { Prize } from '@/types';
import { Trophy, Plus, Trash2 } from 'lucide-react';

interface PrizeManagementProps {
  prizes: Prize[];
  showAddPrize: boolean;
  newPrizeName: string;
  newPrizeStock: number | string;
  setShowAddPrize: (show: boolean) => void;
  setNewPrizeName: (name: string) => void;
  setNewPrizeStock: (stock: number | string) => void;
  onAddPrize: (e: React.FormEvent) => void;
  onDeletePrize: (prizeId: string) => void;
}

export const PrizeManagement: React.FC<PrizeManagementProps> = ({
  prizes,
  showAddPrize,
  newPrizeName,
  newPrizeStock,
  setShowAddPrize,
  setNewPrizeName,
  setNewPrizeStock,
  onAddPrize,
  onDeletePrize,
}) => {
  return (
    <div className="bg-white border border-[#E70013]/20 rounded-3xl p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-[#E70013] flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#E70013]" />
          Manajemen Kategori Doorprize
        </h2>
        <button
          onClick={() => setShowAddPrize(!showAddPrize)}
          className="px-3.5 py-2 rounded-xl bg-[#E70013] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 border border-[#E70013]"
        >
          <Plus className="w-4 h-4" />
          Tambah Kategori Hadiah
        </button>
      </div>

      {showAddPrize && (
        <form
          onSubmit={onAddPrize}
          className="p-4 rounded-2xl bg-[#E70013]/5 border border-[#E70013]/20 flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            placeholder="Nama Hadiah (contoh: Sepeda Listrik)..."
            value={newPrizeName}
            onChange={(e) => setNewPrizeName(e.target.value)}
            className="flex-1 px-3.5 py-2 bg-white border border-[#E70013]/30 rounded-xl text-[#E70013] text-xs font-bold placeholder-[#E70013]/40 focus:outline-none focus:ring-2 focus:ring-[#E70013]/20"
            required
          />
          <input
            type="number"
            min={1}
            placeholder="Jumlah Stok"
            value={newPrizeStock}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') {
                setNewPrizeStock('');
              } else {
                const parsed = parseInt(val, 10);
                setNewPrizeStock(isNaN(parsed) ? '' : parsed);
              }
            }}
            className="w-28 px-3.5 py-2 bg-white border border-[#E70013]/30 rounded-xl text-[#E70013] text-xs font-bold placeholder-[#E70013]/40 focus:outline-none focus:ring-2 focus:ring-[#E70013]/20"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#E70013] text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 border border-[#E70013]"
          >
            Simpan Kategori
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {prizes.map((p) => (
          <div
            key={p.id}
            className="bg-white border border-[#E70013]/20 rounded-2xl p-4 flex items-center justify-between shadow-2xs hover:border-[#E70013]/40 transition-all"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#E70013]/60">#{p.order_num}</span>
                <span className="text-sm font-bold text-[#E70013]">{p.name}</span>
              </div>
              <p className="text-xs font-semibold text-[#E70013]/70 mt-0.5">
                Stok: <span className="font-mono font-bold text-[#E70013]">{p.stock} Unit</span>
              </p>
            </div>
            <button
              onClick={() => onDeletePrize(p.id)}
              className="p-2 rounded-xl bg-white hover:bg-[#E70013] text-[#E70013]/70 hover:text-white border border-[#E70013]/20 hover:border-[#E70013] transition-colors cursor-pointer active:scale-95"
              title="Hapus Kategori Doorprize"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

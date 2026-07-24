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
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Manajemen Kategori Doorprize
        </h2>
        <button
          onClick={() => setShowAddPrize(!showAddPrize)}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Tambah Kategori Hadiah
        </button>
      </div>

      {showAddPrize && (
        <form
          onSubmit={onAddPrize}
          className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            placeholder="Nama Hadiah (contoh: Sepeda Listrik)..."
            value={newPrizeName}
            onChange={(e) => setNewPrizeName(e.target.value)}
            className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
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
            className="w-28 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-colors cursor-pointer active:scale-95"
          >
            Simpan Kategori
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {prizes.map((p) => (
          <div
            key={p.id}
            className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-500">#{p.order_num}</span>
                <span className="text-sm font-bold text-white">{p.name}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Stok: <span className="font-mono font-bold text-amber-400">{p.stock} Unit</span>
              </p>
            </div>
            <button
              onClick={() => onDeletePrize(p.id)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-red-950 text-slate-500 hover:text-red-400 border border-slate-800 hover:border-red-800 transition-colors cursor-pointer active:scale-95"
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

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
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Manajemen Daftar Hadiah ({prizes.length})
        </h2>
        <button
          onClick={() => setShowAddPrize(!showAddPrize)}
          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          Tambah Hadiah
        </button>
      </div>

      {showAddPrize && (
        <form
          onSubmit={onAddPrize}
          className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            placeholder="Nama Hadiah (Contoh: Kipas Angin)..."
            value={newPrizeName}
            onChange={(e) => setNewPrizeName(e.target.value)}
            className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
            required
          />
          <input
            type="number"
            min={1}
            placeholder="Stok"
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
            className="w-24 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold"
          >
            Simpan Hadiah
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {prizes.map((p) => (
          <div
            key={p.id}
            className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
          >
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase">Urutan #{p.order_num}</span>
              <p className="text-sm font-bold text-white">{p.name}</p>
              <p className="text-xs text-slate-400">
                Ditarik: <strong className="text-white">{p.drawn_count}</strong> / {p.stock} unit
              </p>
            </div>
            <button
              onClick={() => onDeletePrize(p.id)}
              className="p-2 rounded-lg bg-red-950/60 text-red-400 hover:bg-red-900 transition-colors"
              title="Hapus Hadiah"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

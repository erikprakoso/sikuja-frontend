import React from 'react';
import { Prize } from '@/types';
import { Trophy, Trash2, PackageCheck } from 'lucide-react';

interface PrizeManagementProps {
  prizes: Prize[];
  onDeletePrize: (prizeId: string) => void;
}

export const PrizeManagement: React.FC<PrizeManagementProps> = ({
  prizes,
  onDeletePrize,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#E70013]" />
            Daftar Kategori Hadiah Undian ({prizes.length})
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Kategori dan stok hadiah ini terdaftar otomatis dari data <strong className="text-slate-800">Pembelian Doorprize</strong>.
          </p>
        </div>
      </div>

      {prizes.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
          <PackageCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800">Belum ada kategori hadiah undian.</p>
          <p className="text-xs text-slate-500 mt-1">
            Catat pengadaan hadiah di menu <strong className="text-slate-700">Pembelian Doorprize</strong> untuk menambahkan item secara otomatis.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {prizes.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">#{p.order_num}</span>
                  <span className="text-sm font-bold text-slate-900">{p.name}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs font-semibold text-slate-500">
                    Stok: <span className="font-mono font-bold text-[#E70013]">{p.stock} Unit</span>
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    Terundi: <span className="font-mono font-bold text-emerald-600">{p.drawn_count}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => onDeletePrize(p.id)}
                className="p-2 rounded-xl bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-300 transition-colors cursor-pointer active:scale-95"
                title="Hapus Kategori Doorprize"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

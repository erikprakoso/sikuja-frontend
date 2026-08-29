import { useState } from 'react';
import { Trophy, PackageCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { Prize } from '@/types';

interface PembelianPrizeGridProps {
  prizes: Prize[];
}

export const PembelianPrizeGrid = ({ prizes }: PembelianPrizeGridProps) => {
  const [showAll, setShowAll] = useState(false);
  const INITIAL = 6;
  const visible = showAll ? prizes : prizes.slice(0, INITIAL);
  const hiddenCount = prizes.length - visible.length;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#E70013]" />
            Status Kategori Hadiah Undian ({prizes.length})
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            Kategori & stok ini dihitung otomatis dari item bernilai <strong className="text-slate-800">Doorprize Undian</strong> di tabel bawah.
          </p>
        </div>
      </div>

      {prizes.length === 0 ? (
        <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
          <PackageCheck className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-slate-800">Belum ada kategori hadiah undian.</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Tambah item dengan tipe <strong className="text-slate-700">Doorprize Undian</strong> untuk mendaftarkan hadiah ke panggung undian.
          </p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map((p) => (
            <div
              key={p.id}
              className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-2xs hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-slate-400">#{p.order_num}</span>
                  <span className="text-xs font-bold text-slate-900">{p.name}</span>
                </div>
                {p.donor_name && (
                  <p className="text-[10px] font-semibold text-violet-600 mt-0.5 truncate">
                    🎁 Hadiah dari: {p.donor_name}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1 text-[11px]">
                  <p className="font-semibold text-slate-500">
                    Stok: <span className="font-mono font-bold text-[#E70013]">{p.stock} Unit</span>
                  </p>
                  <p className="font-semibold text-slate-500">
                    Terundi: <span className="font-mono font-bold text-emerald-600">{p.drawn_count}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {prizes.length > INITIAL && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="w-full mt-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-black hover:bg-slate-50 active:scale-[0.99] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showAll ? 'Sembunyikan' : `Lihat ${hiddenCount} kategori lagi`}
          </button>
        )}
        </>
      )}
    </div>
  );
};

import { Gift, Package, Edit, Trash2 } from 'lucide-react';
import { Purchase } from '@/types';
import { formatRupiah } from '@/lib/format';

interface PembelianMobileCardsProps {
  purchases: Purchase[];
  onEdit: (p: Purchase) => void;
  onDelete: (id: string) => void;
}

export const PembelianMobileCards = ({ purchases, onEdit, onDelete }: PembelianMobileCardsProps) => {
  return (
    <div className="grid gap-3 p-4 md:hidden">
      {purchases.length > 0 ? (
        purchases.map((p) => (
          <div
            key={p.id}
            className="w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            {/* Header: avatar + nama */}
            <div className="flex items-start justify-between gap-3 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#E70013] to-rose-400 text-white flex items-center justify-center text-sm font-black shrink-0">
                  {(p.item_name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 leading-snug break-words">{p.item_name}</p>
                  {p.donor_name ? (
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] text-violet-600 font-semibold truncate">
                      <Gift className="w-3 h-3 shrink-0 text-violet-500" />
                      {p.donor_name}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Total harga */}
              <div className="shrink-0 flex flex-col items-center justify-center rounded-xl bg-blue-50 border border-blue-200 px-2.5 py-1.5">
                <strong className="text-xs sm:text-sm font-black text-blue-700 leading-none text-right">
                  {formatRupiah(p.total_price)}
                </strong>
              </div>
            </div>

            {/* Badge sumber dana & tipe barang */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {p.funding_source === 'penjualan_kupon' ? (
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                  Penjualan Kupon
                </span>
              ) : p.funding_source === 'donasi_barang' ? (
                <span className="px-2 py-0.5 rounded-md bg-violet-100 text-violet-800 border border-violet-200 text-[10px] font-bold">
                  Donasi Barang
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold">
                  Donasi & Sponsor
                </span>
              )}
              {p.is_doorprize !== false ? (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold inline-flex items-center gap-1">
                  <Gift className="w-3 h-3 text-amber-600" />
                  Doorprize
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold inline-flex items-center gap-1">
                  <Package className="w-3 h-3 text-slate-500" />
                  Operasional
                </span>
              )}
            </div>

            {/* Satuan / jumlah / tanggal */}
            <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
              <div className="min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 block">Harga Satuan</span>
                <strong className="text-[11px] font-black text-slate-900 font-mono truncate block">
                  {formatRupiah(p.price_per_unit)}
                </strong>
              </div>
              <div className="min-w-0 text-center">
                <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 block">Jumlah</span>
                <strong className="text-[11px] font-black text-slate-900">{p.qty} unit</strong>
              </div>
              <div className="min-w-0 text-right">
                <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 block">Tgl Beli</span>
                <strong className="text-[11px] font-black text-slate-900">
                  {new Date(p.purchase_date).toLocaleDateString('id-ID')}
                </strong>
              </div>
            </div>

            {/* Catatan */}
            {p.note ? (
              <div className="mt-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-1.5 text-xs text-slate-600 italic">
                {p.note}
              </div>
            ) : null}

            {/* Action footer */}
            <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => onEdit(p)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-[11px] font-bold hover:bg-slate-100 transition-colors cursor-pointer active:scale-95"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => onDelete(p.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-[11px] font-bold hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-2xl border border-slate-200 p-6 text-center text-slate-500 font-semibold">
          Belum ada data pengeluaran & belanja.
        </div>
      )}
    </div>
  );
};

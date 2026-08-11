import { Gift, Package, ArrowUpDown, Edit, Trash2 } from 'lucide-react';
import { Purchase } from '@/types';
import { formatRupiah } from '@/lib/format';

interface PembelianTableProps {
  purchases: Purchase[];
  sortKey: 'date' | 'total' | 'unit';
  sortDir: 'asc' | 'desc';
  onSortChange: (value: string) => void;
  onEdit: (p: Purchase) => void;
  onDelete: (id: string) => void;
}

export const PembelianTable = ({
  purchases,
  sortKey,
  sortDir,
  onSortChange,
  onEdit,
  onDelete,
}: PembelianTableProps) => {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="p-4 font-bold text-slate-700">Item Barang</th>
            <th className="p-4 font-bold text-slate-700">Sumber Dana</th>
            <th className="p-4 font-bold text-slate-700">Tipe Barang</th>
            <th className="p-4 font-bold text-slate-700 text-right">Jumlah</th>
            <th
              onClick={() => onSortChange(sortKey === 'unit' && sortDir === 'desc' ? 'unit-asc' : 'unit-desc')}
              className="p-4 font-bold text-slate-700 text-right cursor-pointer hover:text-[#E70013] transition-colors"
            >
              <span className="inline-flex items-center gap-1">
                Harga Satuan
                <ArrowUpDown className={`w-3.5 h-3.5 ${sortKey === 'unit' ? 'text-[#E70013]' : 'text-slate-400'}`} />
              </span>
            </th>
            <th
              onClick={() => onSortChange(sortKey === 'total' && sortDir === 'desc' ? 'total-asc' : 'total-desc')}
              className="p-4 font-bold text-slate-700 text-right cursor-pointer hover:text-[#E70013] transition-colors"
            >
              <span className="inline-flex items-center gap-1">
                Harga Total
                <ArrowUpDown className={`w-3.5 h-3.5 ${sortKey === 'total' ? 'text-[#E70013]' : 'text-slate-400'}`} />
              </span>
            </th>
            <th
              onClick={() => onSortChange(sortKey === 'date' && sortDir === 'desc' ? 'date-asc' : 'date-desc')}
              className="p-4 font-bold text-slate-700 cursor-pointer hover:text-[#E70013] transition-colors"
            >
              <span className="inline-flex items-center gap-1">
                Tgl Beli
                <ArrowUpDown className={`w-3.5 h-3.5 ${sortKey === 'date' ? 'text-[#E70013]' : 'text-slate-400'}`} />
              </span>
            </th>
            <th className="p-4 font-bold text-slate-700 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {purchases.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-12 text-center text-slate-500">
                <p className="text-lg font-semibold">Belum ada data pengeluaran & belanja.</p>
                <p className="text-xs mt-2">Klik &quot;Pengeluaran Baru&quot; untuk menambahkan data.</p>
              </td>
            </tr>
          ) : (
            purchases.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-900">
                  <div>
                    <p>{p.item_name}</p>
                    {p.donor_name && (
                      <p className="text-[11px] text-violet-600 font-semibold">🎁 dari {p.donor_name}</p>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  {p.funding_source === 'penjualan_kupon' ? (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold inline-flex items-center gap-1">
                      🎟️ Penjualan Kupon
                    </span>
                  ) : p.funding_source === 'donasi_barang' ? (
                    <span className="px-2.5 py-1 rounded-lg bg-violet-100 text-violet-800 border border-violet-200 text-xs font-bold inline-flex items-center gap-1">
                      🎁 Donasi Barang
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold inline-flex items-center gap-1">
                      🎁 Donasi & Sponsor
                    </span>
                  )}
                </td>
                <td className="p-4">
                  {p.is_doorprize !== false ? (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold inline-flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5 text-amber-600" />
                      Doorprize Undian
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold inline-flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-slate-500" />
                      Operasional
                    </span>
                  )}
                </td>
                <td className="p-4 text-slate-600 text-right font-semibold">{p.qty} unit</td>
                <td className="p-4 text-slate-600 text-right">{formatRupiah(p.price_per_unit)}</td>
                <td className="p-4 text-blue-700 font-bold text-right">{formatRupiah(p.total_price)}</td>
                <td className="p-4 text-slate-500">{new Date(p.purchase_date).toLocaleDateString('id-ID')}</td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(p)}
                      className="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                      title="Edit Pembelian"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(p.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Hapus Pembelian"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

import { ArrowUpDown, Edit, Trash2 } from 'lucide-react';
import { Donation } from '@/types';
import { formatRupiah } from '@/lib/format';

interface DonasiTableProps {
  donations: Donation[];
  sortKey: 'date' | 'amount';
  sortDir: 'asc' | 'desc';
  onSortChange: (value: string) => void;
  onEdit: (d: Donation) => void;
  onDelete: (id: string) => void;
}

export const DonasiTable = ({
  donations,
  sortKey,
  sortDir,
  onSortChange,
  onEdit,
  onDelete,
}: DonasiTableProps) => {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="p-4 font-bold text-slate-700">Donatur / Sponsor</th>
            <th
              onClick={() => onSortChange(sortKey === 'amount' && sortDir === 'desc' ? 'amount-asc' : 'amount-desc')}
              className="p-4 font-bold text-slate-700 text-right cursor-pointer hover:text-[#E70013] transition-colors"
            >
              <span className="inline-flex items-center gap-1">
                Nominal (Rp)
                <ArrowUpDown className={`w-3.5 h-3.5 ${sortKey === 'amount' ? 'text-[#E70013]' : 'text-slate-400'}`} />
              </span>
            </th>
            <th
              onClick={() => onSortChange(sortKey === 'date' && sortDir === 'desc' ? 'date-asc' : 'date-desc')}
              className="p-4 font-bold text-slate-700 cursor-pointer hover:text-[#E70013] transition-colors"
            >
              <span className="inline-flex items-center gap-1">
                Tanggal Diterima
                <ArrowUpDown className={`w-3.5 h-3.5 ${sortKey === 'date' ? 'text-[#E70013]' : 'text-slate-400'}`} />
              </span>
            </th>
            <th className="p-4 font-bold text-slate-700">Catatan</th>
            <th className="p-4 font-bold text-slate-700 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {donations.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-12 text-center text-slate-500">
                <p className="text-lg font-semibold">Belum ada data pemasukan donasi.</p>
                <p className="text-xs mt-2">Klik &quot;Pemasukan Baru&quot; untuk menambahkan data donatur.</p>
              </td>
            </tr>
          ) : (
            donations.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-slate-900">
                  <div>
                    <p>{d.donor_name}</p>
                    {d.donor_phone && (
                      <p className="text-xs text-slate-500 font-normal">{d.donor_phone}</p>
                    )}
                  </div>
                </td>
                <td className="p-4 text-emerald-600 font-extrabold text-right">
                  {formatRupiah(d.amount)}
                </td>
                <td className="p-4 text-slate-500">
                  {new Date(d.received_at).toLocaleDateString('id-ID')}
                </td>
                <td className="p-4 text-slate-600 italic">
                  {d.note || '-'}
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(d)}
                      className="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                      title="Edit Donasi"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(d.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Hapus Donasi"
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

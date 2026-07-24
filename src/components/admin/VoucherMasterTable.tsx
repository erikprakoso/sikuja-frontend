import React from 'react';
import { Voucher } from '@/types';
import { Ticket, Search } from 'lucide-react';

interface VoucherMasterTableProps {
  vouchers: Voucher[];
  searchQuery: string;
  statusFilter: string;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: string) => void;
}

export const VoucherMasterTable: React.FC<VoucherMasterTableProps> = ({
  vouchers,
  searchQuery,
  statusFilter,
  setSearchQuery,
  setStatusFilter,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Ticket className="w-5 h-5 text-red-400" />
          Master Data Voucher ({vouchers.length})
        </h2>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <input
              type="text"
              placeholder="Cari kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono"
            />
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200"
          >
            <option value="all">Semua Status</option>
            <option value="terbit">Terbit (Belum Checkin)</option>
            <option value="checkin">Check-in Pos</option>
            <option value="menang">Menang Undian</option>
            <option value="diklaim">Sudah Diklaim</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
            <tr>
              <th className="p-3">Kode 5-Digit</th>
              <th className="p-3">Tipe</th>
              <th className="p-3">Status</th>
              <th className="p-3">Hadiah (Jika Menang)</th>
              <th className="p-3">Waktu Terbit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {vouchers.slice(0, 50).map((v) => (
              <tr key={v.code} className="hover:bg-slate-800/40">
                <td className="p-3 font-bold text-white tracking-widest">{v.code}</td>
                <td className="p-3 capitalize">{v.type}</td>
                <td className="p-3 font-sans">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      v.status === 'checkin'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : v.status === 'menang'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : v.status === 'diklaim'
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {v.status}
                  </span>
                </td>
                <td className="p-3 font-sans text-slate-300">{v.prize_name || '-'}</td>
                <td className="p-3 text-[11px] text-slate-400">
                  {new Date(v.created_at).toLocaleTimeString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

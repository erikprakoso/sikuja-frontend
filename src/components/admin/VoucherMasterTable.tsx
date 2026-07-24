import React, { useState, useEffect } from 'react';
import { Voucher } from '@/types';
import { Ticket, Search, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, pageSize]);

  const totalVouchers = vouchers.length;
  const totalPages = Math.max(1, Math.ceil(totalVouchers / pageSize));

  // Ensure currentPage does not exceed totalPages
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalVouchers);
  const currentVouchers = vouchers.slice(startIndex, endIndex);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
      {/* Top Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Ticket className="w-5 h-5 text-red-400" />
          Data Utama Kupon ({totalVouchers})
        </h2>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-48">
            <input
              type="text"
              placeholder="Cari kode kupon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-red-500"
            />
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="terbit">Terbit (Belum Verifikasi)</option>
            <option value="checkin">Terverifikasi Pos</option>
            <option value="menang">Pemenang Undian</option>
            <option value="diklaim">Hadiah Diserahkan</option>
          </select>

          {/* Page Size Select */}
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-slate-400 focus:outline-none"
          >
            <option value={10}>10 / hlm</option>
            <option value={25}>25 / hlm</option>
            <option value={50}>50 / hlm</option>
            <option value={100}>100 / hlm</option>
          </select>
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
            <tr>
              <th className="p-3">Kode Kupon</th>
              <th className="p-3">Jenis</th>
              <th className="p-3">Status</th>
              <th className="p-3">Hadiah</th>
              <th className="p-3">Waktu Transaksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {currentVouchers.length > 0 ? (
              currentVouchers.map((v) => (
                <tr key={v.code} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-bold text-white tracking-widest">{v.code}</td>
                  <td className="p-3 capitalize text-slate-300 font-sans">{v.type}</td>
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
                      {v.status === 'checkin'
                        ? 'Terverifikasi'
                        : v.status === 'menang'
                        ? 'Pemenang'
                        : v.status === 'diklaim'
                        ? 'Diserahkan'
                        : 'Terbit'}
                    </span>
                  </td>
                  <td className="p-3 font-sans text-slate-300">{v.prize_name || '-'}</td>
                  <td className="p-3 text-[11px] text-slate-400">
                    {new Date(v.created_at).toLocaleTimeString('id-ID')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                  Tidak ada data kupon yang sesuai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Controls */}
      {totalVouchers > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs">
          <span className="text-slate-400 text-[11px]">
            Menampilkan <strong className="text-white">{startIndex + 1}</strong>–
            <strong className="text-white">{endIndex}</strong> dari{' '}
            <strong className="text-white">{totalVouchers}</strong> data kupon
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage <= 1}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition-colors"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page Buttons */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (safeCurrentPage > 3) {
                    pageNum = safeCurrentPage - 2 + i;
                  }
                  if (pageNum > totalPages) {
                    pageNum = totalPages - (4 - i);
                  }
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-all ${
                      safeCurrentPage === pageNum
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition-colors"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

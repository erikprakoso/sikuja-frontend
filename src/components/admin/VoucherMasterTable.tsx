import React, { useState, useMemo } from 'react';
import { Voucher, Transaction } from '@/types';
import { Ticket, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface VoucherMasterTableProps {
  vouchers: Voucher[];
  transactions?: Transaction[];
  searchQuery: string;
  statusFilter: string;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: string) => void;
}

export const VoucherMasterTable: React.FC<VoucherMasterTableProps> = ({
  vouchers,
  transactions = [],
  searchQuery,
  statusFilter,
  setSearchQuery,
  setStatusFilter,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (filter: string) => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const txMap = useMemo(() => {
    const map = new Map<string, Transaction>();
    transactions.forEach((tx) => map.set(tx.id, tx));
    return map;
  }, [transactions]);

  const filteredVouchers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return vouchers.filter((v) => {
      const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;

      const tx = txMap.get(v.transaction_id);
      const custName = (tx?.customer_name || '').toLowerCase();
      const custPhone = (tx?.customer_phone || '').toLowerCase();
      const prizeName = (v.prize_name || '').toLowerCase();

      return (
        v.code.toLowerCase().includes(q) ||
        custName.includes(q) ||
        custPhone.includes(q) ||
        prizeName.includes(q)
      );
    });
  }, [vouchers, txMap, statusFilter, searchQuery]);

  const totalVouchers = filteredVouchers.length;
  const totalPages = Math.max(1, Math.ceil(totalVouchers / pageSize));

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalVouchers);
  const currentVouchers = filteredVouchers.slice(startIndex, endIndex);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
      {/* Top Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Ticket className="w-5 h-5 text-[#E70013]" />
          Data Utama Kupon ({totalVouchers})
        </h2>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Cari kode, nama, atau no. HP..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#E70013]/20 placeholder-slate-400"
            />
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="terbit">Terbit (Belum Verifikasi)</option>
            <option value="checkin">Terverifikasi Pos</option>
            <option value="menang">Pemenang Undian</option>
            <option value="diklaim">Hadiah Diserahkan</option>
            <option value="forfeited">Gugur (Hangus)</option>
          </select>

          {/* Page Size Select */}
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value={10}>10 / hlm</option>
            <option value={25}>25 / hlm</option>
            <option value={50}>50 / hlm</option>
            <option value={100}>100 / hlm</option>
          </select>
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-xs text-slate-800">
          <thead className="bg-slate-900 text-white uppercase font-bold text-[10px]">
            <tr>
              <th className="p-3">Kode Kupon</th>
              <th className="p-3">Pembeli / Pemegang</th>
              <th className="p-3">Jenis</th>
              <th className="p-3">Status</th>
              <th className="p-3">Hadiah</th>
              <th className="p-3">Waktu Transaksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-sans">
            {currentVouchers.length > 0 ? (
              currentVouchers.map((v) => {
                const tx = txMap.get(v.transaction_id);
                const custName = tx?.customer_name || '-';
                const custPhone = tx?.customer_phone || '';

                return (
                  <tr key={v.code} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-black text-slate-900 tracking-widest">{v.code}</td>
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{custName}</span>
                        {custPhone ? (
                          <span className="text-[11px] text-slate-500 font-mono font-semibold">{custPhone}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-3 capitalize font-semibold text-slate-700">{v.type}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          v.status === 'checkin'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : v.status === 'menang'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : v.status === 'diklaim'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : v.status === 'forfeited'
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        {v.status === 'checkin'
                          ? 'Terverifikasi'
                          : v.status === 'menang'
                          ? 'Pemenang'
                          : v.status === 'diklaim'
                          ? 'Diserahkan'
                          : v.status === 'forfeited'
                          ? 'Gugur'
                          : 'Terbit'}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-700">{v.prize_name || '-'}</td>
                    <td className="p-3 text-[11px] font-mono font-semibold text-slate-500">
                      {new Date(v.created_at).toLocaleTimeString('id-ID')}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-500 font-semibold font-sans">
                  Tidak ada data kupon yang sesuai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Controls */}
      {totalVouchers > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs font-semibold text-slate-600">
          <span className="text-[11px]">
            Menampilkan <strong className="font-black text-slate-900">{startIndex + 1}</strong>–
            <strong className="font-black text-slate-900">{endIndex}</strong> dari{' '}
            <strong className="font-black text-slate-900">{totalVouchers}</strong> data kupon
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage <= 1}
              className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer active:scale-95"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page Buttons */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const visibleCount = Math.min(5, totalPages);
                const windowStart = Math.max(
                  1,
                  Math.min(safeCurrentPage - Math.floor(visibleCount / 2), totalPages - visibleCount + 1)
                );
                const pageNum = windowStart + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer active:scale-95 border ${
                      safeCurrentPage === pageNum
                        ? 'bg-[#E70013] border-[#E70013] text-white shadow-xs'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
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
              className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer active:scale-95"
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

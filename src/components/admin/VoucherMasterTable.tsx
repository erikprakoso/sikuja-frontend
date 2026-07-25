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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, pageSize]);

  const totalVouchers = vouchers.length;
  const totalPages = Math.max(1, Math.ceil(totalVouchers / pageSize));

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalVouchers);
  const currentVouchers = vouchers.slice(startIndex, endIndex);

  return (
    <div className="bg-white border-4 border-[#E70013] rounded-3xl p-6 space-y-4 shadow-xl">
      {/* Top Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-base font-black text-[#E70013] flex items-center gap-2">
          <Ticket className="w-5 h-5 text-[#E70013]" />
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
              className="w-full pl-8 pr-3 py-1.5 bg-white border-2 border-[#E70013] rounded-xl text-[#E70013] text-xs font-mono font-black focus:outline-none placeholder-[#E70013]/50"
            />
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[#E70013]" />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border-2 border-[#E70013] rounded-xl text-xs font-black text-[#E70013] focus:outline-none cursor-pointer"
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
            className="px-2.5 py-1.5 bg-white border-2 border-[#E70013] rounded-xl text-xs font-black text-[#E70013] focus:outline-none cursor-pointer"
          >
            <option value={10}>10 / hlm</option>
            <option value={25}>25 / hlm</option>
            <option value={50}>50 / hlm</option>
            <option value={100}>100 / hlm</option>
          </select>
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto rounded-2xl border-2 border-[#E70013]">
        <table className="w-full text-left text-xs text-[#E70013]">
          <thead className="bg-[#E70013] text-white uppercase font-black text-[10px] border-b-2 border-[#E70013]">
            <tr>
              <th className="p-3">Kode Kupon</th>
              <th className="p-3">Jenis</th>
              <th className="p-3">Status</th>
              <th className="p-3">Hadiah</th>
              <th className="p-3">Waktu Transaksi</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-[#E70013]/20 font-mono font-bold">
            {currentVouchers.length > 0 ? (
              currentVouchers.map((v) => (
                <tr key={v.code} className="hover:bg-[#E70013]/10 transition-colors">
                  <td className="p-3 font-black text-[#E70013] tracking-widest">{v.code}</td>
                  <td className="p-3 capitalize font-sans">{v.type}</td>
                  <td className="p-3 font-sans">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        v.status === 'checkin'
                          ? 'bg-[#E70013] text-white'
                          : v.status === 'menang'
                          ? 'bg-[#E70013] text-white'
                          : v.status === 'diklaim'
                          ? 'bg-[#E70013] text-white'
                          : 'bg-white text-[#E70013] border border-[#E70013]'
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
                  <td className="p-3 font-sans font-bold">{v.prize_name || '-'}</td>
                  <td className="p-3 text-[11px] font-bold">
                    {new Date(v.created_at).toLocaleTimeString('id-ID')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-6 text-center text-[#E70013] font-black font-sans">
                  Tidak ada data kupon yang sesuai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Controls */}
      {totalVouchers > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs font-bold text-[#E70013]">
          <span className="text-[11px]">
            Menampilkan <strong className="font-black">{startIndex + 1}</strong>–
            <strong className="font-black">{endIndex}</strong> dari{' '}
            <strong className="font-black">{totalVouchers}</strong> data kupon
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage <= 1}
              className="p-1.5 rounded-lg bg-white border-2 border-[#E70013] text-[#E70013] hover:bg-[#E70013] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer active:scale-95"
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
                    className={`w-7 h-7 rounded-lg text-xs font-black font-mono transition-all cursor-pointer active:scale-95 border-2 border-[#E70013] ${
                      safeCurrentPage === pageNum
                        ? 'bg-[#E70013] text-white shadow-md'
                        : 'bg-white text-[#E70013] hover:bg-[#E70013] hover:text-white'
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
              className="p-1.5 rounded-lg bg-white border-2 border-[#E70013] text-[#E70013] hover:bg-[#E70013] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer active:scale-95"
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

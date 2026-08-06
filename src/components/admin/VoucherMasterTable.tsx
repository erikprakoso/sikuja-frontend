import React, { useState, useMemo } from 'react';
import { Voucher, Transaction } from '@/types';
import { Ticket, Search, ChevronLeft, ChevronRight, Printer, Pencil, Check, X } from 'lucide-react';
import { ThermalReceiptModal } from '@/components/penjualan/ThermalReceiptModal';
import { ThermalReceiptPrint } from '@/components/penjualan/ThermalReceiptPrint';
import { getStoredTransactions, saveTransactions } from '@/lib/storage';

interface VoucherMasterTableProps {
  vouchers: Voucher[];
  transactions?: Transaction[];
  searchQuery: string;
  statusFilter: string;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: string) => void;
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  terbit: { label: 'Terbit', cls: 'bg-slate-100 text-slate-600 border border-slate-300' },
  checkin: { label: 'Terverifikasi', cls: 'bg-emerald-100 text-emerald-800 border border-emerald-300' },
  menang: { label: 'Pemenang', cls: 'bg-amber-100 text-amber-800 border border-amber-300' },
  diklaim: { label: 'Diserahkan', cls: 'bg-purple-100 text-purple-800 border border-purple-300' },
  forfeited: { label: 'Gugur', cls: 'bg-red-100 text-red-800 border border-red-300' },
};

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
  const [reprintTx, setReprintTx] = useState<Transaction | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editError, setEditError] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const startEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditName(tx.customer_name || '');
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditError('');
  };

  const handleSaveName = async (tx: Transaction) => {
    const name = editName.trim();
    if (!name) {
      setEditError('Nama tidak boleh kosong.');
      return;
    }
    if (name === (tx.customer_name || '')) {
      cancelEdit();
      return;
    }

    setIsSaving(true);
    setEditError('');

    try {
      const res = await fetch('/api/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tx.id, customerName: name }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setEditError(data.error || 'Gagal menyimpan nama.');
        return;
      }

      // Update cache lokal agar UI langsung tercermin (event → halaman refresh).
      const all = getStoredTransactions();
      const updated = all.map((t) => (t.id === tx.id ? { ...t, customer_name: name } : t));
      if (updated.length !== all.length) {
        updated.push({ ...tx, customer_name: name });
      }
      await saveTransactions(updated);
      cancelEdit();
    } catch {
      setEditError('Tidak dapat terhubung ke server. Coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

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

  const groupedByTx = useMemo(() => {
    const map = new Map<string, Voucher[]>();
    vouchers.forEach((v) => {
      const arr = map.get(v.transaction_id) || [];
      arr.push(v);
      map.set(v.transaction_id, arr);
    });
    return map;
  }, [vouchers]);

  const reprintVouchers = useMemo(
    () => (reprintTx ? vouchers.filter((v) => v.transaction_id === reprintTx.id) : []),
    [reprintTx, vouchers]
  );

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const entries: Array<{ tx?: Transaction; vouchers: Voucher[] }> = [];

    groupedByTx.forEach((vs, txId) => {
      const tx = txMap.get(txId);

      if (statusFilter !== 'all' && !vs.some((v) => v.status === statusFilter)) return;

      if (q) {
        const custName = (tx?.customer_name || '').toLowerCase();
        const custPhone = (tx?.customer_phone || '').toLowerCase();
        const token = (tx?.token || '').toLowerCase();
        const hasCodeMatch = vs.some((v) => v.code.toLowerCase().includes(q));
        if (!hasCodeMatch && !custName.includes(q) && !custPhone.includes(q) && !token.includes(q)) {
          return;
        }
      }

      entries.push({ tx, vouchers: vs });
    });

    return entries.sort((a, b) => {
      const da = a.tx?.created_at || a.vouchers[0]?.created_at || '';
      const db = b.tx?.created_at || b.vouchers[0]?.created_at || '';
      return new Date(db).getTime() - new Date(da).getTime();
    });
  }, [groupedByTx, txMap, statusFilter, searchQuery]);

  const totalTransactions = filteredTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalTransactions / pageSize));

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalTransactions);
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
      {/* Top Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Ticket className="w-5 h-5 text-[#E70013]" />
          Data Transaksi ({totalTransactions})
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

      {/* Mobile Card List */}
      <div className="grid gap-3 md:hidden">
        {currentTransactions.length > 0 ? (
          currentTransactions.map(({ tx, vouchers: vs }) => {
            const custName = tx?.customer_name || '-';
            const custPhone = tx?.customer_phone || '';
            const txTime = tx?.created_at || vs[0]?.created_at || '';
            const statusList = [...new Set(vs.map((v) => v.status))].map(
              (status) => STATUS_META[status]
            );

            return (
              <div
                key={tx?.id || vs[0].transaction_id}
                className="rounded-2xl border border-slate-200 p-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {editingId === tx?.id ? (
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Nama pembeli"
                          autoFocus
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E70013]/20 placeholder-slate-400"
                        />
                        {editError && <p className="text-[11px] font-bold text-red-600">{editError}</p>}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSaveName(tx)}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#E70013] text-white text-[11px] font-bold hover:bg-[#C50010] transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                          >
                            <Check className="w-3 h-3" />
                            {isSaving ? 'Menyimpan...' : 'Simpan'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-300 text-slate-600 text-[11px] font-bold hover:bg-slate-100 transition-colors cursor-pointer active:scale-95"
                          >
                            <X className="w-3 h-3" />
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-bold text-slate-900 truncate">{custName}</p>
                        {custPhone ? (
                          <span className="text-[11px] text-slate-500 font-mono font-semibold">{custPhone}</span>
                        ) : null}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {tx && (
                      <button
                        onClick={() => startEdit(tx)}
                        title="Ubah Nama"
                        className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer active:scale-95"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {tx && (
                      <button
                        onClick={() => setReprintTx(tx)}
                        title="Cetak Ulang Struk"
                        className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-[#E70013] hover:text-white hover:border-[#E70013] transition-colors cursor-pointer active:scale-95"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {statusList.map((meta) => (
                    <span key={meta.label} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.cls}`}>
                      {meta.label}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-600 border-t border-slate-100 pt-2">
                  <span className="font-mono">
                    {new Date(txTime).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span>
                    <strong className="font-black text-slate-900">{vs.length}</strong>{' '}
                    <span className="text-slate-500">voucher</span>
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-slate-200 p-6 text-center text-slate-500 font-semibold font-sans">
            Tidak ada transaksi yang sesuai.
          </div>
        )}
      </div>

      {/* Table Data */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-xs text-slate-800">
          <thead className="bg-slate-900 text-white uppercase font-bold text-[10px]">
            <tr>
              <th className="p-3">Waktu Transaksi</th>
              <th className="p-3">Pembeli</th>
              <th className="p-3">Voucher</th>
              <th className="p-3">Status</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-sans">
            {currentTransactions.length > 0 ? (
              currentTransactions.map(({ tx, vouchers: vs }) => {
                const custName = tx?.customer_name || '-';
                const custPhone = tx?.customer_phone || '';
                const txTime = tx?.created_at || vs[0]?.created_at || '';

                const statusList = [...new Set(vs.map((v) => v.status))].map(
                  (status) => STATUS_META[status]
                );

                return (
                  <tr key={tx?.id || vs[0].transaction_id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                      {new Date(txTime).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-3">
                      {editingId === tx?.id ? (
                        <div className="space-y-1.5 min-w-56">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Nama pembeli"
                            autoFocus
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E70013]/20 placeholder-slate-400"
                          />
                          {editError && <p className="text-[11px] font-bold text-red-600">{editError}</p>}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleSaveName(tx)}
                              disabled={isSaving}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#E70013] text-white text-[11px] font-bold hover:bg-[#C50010] transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" />
                              {isSaving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-300 text-slate-600 text-[11px] font-bold hover:bg-slate-100 transition-colors cursor-pointer active:scale-95"
                            >
                              <X className="w-3 h-3" />
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{custName}</span>
                          {custPhone ? (
                            <span className="text-[11px] text-slate-500 font-mono font-semibold">{custPhone}</span>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="font-black text-slate-900">{vs.length}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {statusList.map((meta) => (
                          <span
                            key={meta.label}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.cls}`}
                          >
                            {meta.label}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      {tx && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => startEdit(tx)}
                            title="Ubah Nama"
                            className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer active:scale-95"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setReprintTx(tx)}
                            title="Cetak Ulang Struk"
                            className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-[#E70013] hover:text-white hover:border-[#E70013] transition-colors cursor-pointer active:scale-95"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500 font-semibold font-sans">
                  Tidak ada transaksi yang sesuai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Controls */}
      {totalTransactions > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs font-semibold text-slate-600">
          <span className="text-[11px]">
            Menampilkan <strong className="font-black text-slate-900">{startIndex + 1}</strong>–
            <strong className="font-black text-slate-900">{endIndex}</strong> dari{' '}
            <strong className="font-black text-slate-900">{totalTransactions}</strong> data transaksi
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

      {/* Modal Cetak Ulang Struk */}
      {reprintTx && (
        <>
          <ThermalReceiptModal
            transaction={reprintTx}
            vouchers={reprintVouchers}
            onClose={() => setReprintTx(null)}
          />
          {/* Area print fallback browser (58mm) */}
          <ThermalReceiptPrint transaction={reprintTx} vouchers={reprintVouchers} />
        </>
      )}
    </div>
  );
};

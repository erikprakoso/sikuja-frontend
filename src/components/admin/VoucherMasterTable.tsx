import React, { useState, useMemo } from 'react';
import { Voucher, Transaction } from '@/types';
import { Ticket, Search, ChevronLeft, ChevronRight, Printer, Pencil, Check, X, Combine, Clock, Phone } from 'lucide-react';
import { ThermalReceiptModal } from '@/components/penjualan/ThermalReceiptModal';
import { ThermalReceiptPrint } from '@/components/penjualan/ThermalReceiptPrint';
import { getStoredTransactions, saveTransactions, getStoredVouchers, saveVouchers } from '@/lib/storage';

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
  const [mergeBase, setMergeBase] = useState<Transaction | null>(null);
  const [mergeSelected, setMergeSelected] = useState<string[]>([]);
  const [mergeSearch, setMergeSearch] = useState<string>('');
  const [mergeError, setMergeError] = useState<string>('');
  const [isMerging, setIsMerging] = useState<boolean>(false);

  const openMergePicker = (tx: Transaction) => {
    setMergeBase(tx);
    setMergeSelected([]);
    setMergeSearch('');
    setMergeError('');
  };

  const closeMergePicker = () => {
    setMergeBase(null);
    setMergeSelected([]);
    setMergeSearch('');
    setMergeError('');
  };

  const toggleMergeSelect = (id: string) => {
    setMergeSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleMerge = async () => {
    if (!mergeBase || mergeSelected.length === 0) return;
    setIsMerging(true);
    setMergeError('');

    try {
      const res = await fetch('/api/transactions/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: mergeBase.id, sourceIds: mergeSelected }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setMergeError(data.error || 'Gagal menggabungkan transaksi.');
        return;
      }

      // Update cache lokal agar UI langsung tercermin (event → halaman refresh).
      const allTxs = getStoredTransactions();
      const allVouchers = getStoredVouchers();
      const selectedSet = new Set(mergeSelected);

      const updatedVouchers = allVouchers.map((v) =>
        selectedSet.has(v.transaction_id) ? { ...v, transaction_id: mergeBase.id } : v
      );

      const sums = allTxs
        .filter((t) => selectedSet.has(t.id))
        .reduce(
          (acc, s) => ({
            qty_fisik: acc.qty_fisik + (s.qty_fisik || 0),
            qty_non_fisik: acc.qty_non_fisik + (s.qty_non_fisik || 0),
            total_harga: acc.total_harga + (s.total_harga || 0),
          }),
          { qty_fisik: 0, qty_non_fisik: 0, total_harga: 0 }
        );

      const baseInStore = allTxs.find((t) => t.id === mergeBase.id);
      const updatedTxs = baseInStore
        ? allTxs
            .map((t) =>
              t.id === mergeBase.id
                ? {
                    ...t,
                    qty_fisik: (t.qty_fisik || 0) + sums.qty_fisik,
                    qty_non_fisik: (t.qty_non_fisik || 0) + sums.qty_non_fisik,
                    total_harga: (t.total_harga || 0) + sums.total_harga,
                  }
                : t
            )
            .filter((t) => !selectedSet.has(t.id))
        : [
            ...allTxs.filter((t) => !selectedSet.has(t.id)),
            { ...mergeBase, ...sums },
          ];

      await saveVouchers(updatedVouchers);
      await saveTransactions(updatedTxs);
      closeMergePicker();
    } catch {
      setMergeError('Tidak dapat terhubung ke server. Coba lagi.');
    } finally {
      setIsMerging(false);
    }
  };

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

  const mergeCandidates = useMemo(() => {
    if (!mergeBase) return [];
    const q = mergeSearch.trim().toLowerCase();

    const out: Array<{ tx: Transaction; vouchers: Voucher[] }> = [];
    txMap.forEach((tx) => {
      if (tx.id === mergeBase.id) return;
      const vs = groupedByTx.get(tx.id) || [];
      if (q) {
        const name = (tx.customer_name || '').toLowerCase();
        const phone = (tx.customer_phone || '').toLowerCase();
        const hasCodeMatch = vs.some((v) => v.code.toLowerCase().includes(q));
        if (!name.includes(q) && !phone.includes(q) && !hasCodeMatch) return;
      }
      out.push({ tx, vouchers: vs });
    });

    return out.sort((a, b) => {
      const da = a.tx.created_at || a.vouchers[0]?.created_at || '';
      const db = b.tx.created_at || b.vouchers[0]?.created_at || '';
      return new Date(db).getTime() - new Date(da).getTime();
    });
  }, [mergeBase, mergeSearch, txMap, groupedByTx]);

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
                className="w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                {/* Header: avatar + nama */}
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#E70013] to-rose-400 text-white flex items-center justify-center text-sm font-black shrink-0">
                      {(custName || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
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
                          <p className="font-bold text-slate-900 leading-snug break-words">{custName}</p>
                          {custPhone ? (
                            <span className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 font-mono font-semibold break-all">
                              <Phone className="w-3 h-3 shrink-0 text-slate-400" />
                              {custPhone}
                            </span>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Total voucher */}
                  <div className="shrink-0 flex flex-col items-center justify-center rounded-xl bg-slate-50 border border-slate-200 px-2.5 py-1.5">
                    <strong className="text-sm font-black text-[#E70013] leading-none">{vs.length}</strong>
                    <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">Voucher</span>
                  </div>
                </div>

                {/* Status badges (kiri) + waktu (kanan) */}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    {statusList.map((meta) => (
                      <span key={meta.label} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.cls}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {meta.label}
                      </span>
                    ))}
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(txTime).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {/* Action footer */}
                <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  {tx && (
                    <button
                      onClick={() => openMergePicker(tx)}
                      title="Gabungkan Transaksi"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-[11px] font-bold hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-colors cursor-pointer active:scale-95"
                    >
                      <Combine className="w-3.5 h-3.5" />
                      Gabung
                    </button>
                  )}
                  {tx && (
                    <button
                      onClick={() => startEdit(tx)}
                      title="Ubah Nama"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-[11px] font-bold hover:bg-slate-100 transition-colors cursor-pointer active:scale-95"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  )}
                  {tx && (
                    <button
                      onClick={() => setReprintTx(tx)}
                      title="Cetak Ulang Struk"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-[11px] font-bold hover:bg-[#E70013] hover:text-white hover:border-[#E70013] transition-colors cursor-pointer active:scale-95"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Cetak
                    </button>
                  )}
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
                  <tr key={tx?.id || vs[0].transaction_id} className="transition-colors hover:bg-slate-50">
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
                            onClick={() => openMergePicker(tx)}
                            title="Gabungkan Transaksi"
                            className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-colors cursor-pointer active:scale-95"
                          >
                            <Combine className="w-4 h-4" />
                          </button>
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

      {/* Modal Pilih Source untuk Digabung ke Base */}
      {mergeBase && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={isMerging ? undefined : closeMergePicker}
        >
          <div
            className="w-full max-w-md max-h-[85vh] flex flex-col rounded-3xl bg-white shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-6 pt-6">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Combine className="w-5 h-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-slate-900">Gabungkan ke Base</h3>
                  <p className="truncate text-xs font-semibold text-slate-500">
                    {mergeBase.customer_name || 'Tanpa Nama'} ({groupedByTx.get(mergeBase.id)?.length || 0} voucher)
                  </p>
                </div>
              </div>
              <button
                onClick={closeMergePicker}
                disabled={isMerging}
                className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pencarian source */}
            <div className="px-6 pt-4">
              <div className="relative">
                <input
                  type="text"
                  value={mergeSearch}
                  onChange={(e) => setMergeSearch(e.target.value)}
                  placeholder="Cari source: nama, no. HP, atau kode..."
                  disabled={isMerging}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E70013]/20 placeholder-slate-400"
                />
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* Daftar source */}
            <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
              {mergeCandidates.length > 0 ? (
                mergeCandidates.map(({ tx, vouchers: vs }) => {
                  const checked = mergeSelected.includes(tx.id);
                  return (
                    <button
                      key={tx.id}
                      onClick={() => toggleMergeSelect(tx.id)}
                      disabled={isMerging}
                      className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer active:scale-[0.99] disabled:opacity-60 ${
                        checked
                          ? 'border-[#E70013] bg-[#E70013]/5'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center transition-colors ${
                          checked ? 'bg-[#E70013] border-[#E70013] text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {checked && <Check className="w-3.5 h-3.5" />}
                      </span>
                      <span className="w-9 h-9 shrink-0 rounded-full bg-linear-to-br from-slate-500 to-slate-700 text-white flex items-center justify-center text-xs font-black">
                        {(tx.customer_name || '?').charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-slate-900 text-xs truncate">
                          {tx.customer_name || 'Tanpa Nama'}
                        </span>
                        <span className="block text-[11px] text-slate-500 font-mono font-semibold truncate">
                          {vs.length} voucher ·{' '}
                          {new Date(tx.created_at || vs[0]?.created_at || '').toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="py-8 text-center text-xs font-semibold text-slate-400">
                  Tidak ada transaksi lain untuk digabung.
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 space-y-3">
              {mergeError && <p className="text-xs font-bold text-red-600 text-center">{mergeError}</p>}
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={closeMergePicker}
                  disabled={isMerging}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleMerge}
                  disabled={isMerging || mergeSelected.length === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E70013] text-white text-xs font-black hover:bg-[#C50010] transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Combine className="w-3.5 h-3.5" />
                  {isMerging ? 'Menggabungkan...' : `Gabungkan ${mergeSelected.length} transaksi`}
                </button>
              </div>
            </div>
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

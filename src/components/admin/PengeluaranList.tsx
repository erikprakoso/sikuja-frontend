import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Loader2, X, Edit, Trash2, ChevronLeft, ChevronRight, TrendingDown } from 'lucide-react';

interface Expense {
  id: string;
  category: string;
  item_name: string;
  qty: number;
  price_per_unit: number;
  total_price: number;
  expense_date: string;
  payment_method: 'cash' | 'qris' | 'transfer';
  note: string | null;
}

export const PengeluaranList = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [newItem, setNewItem] = useState('');
  const [newQty, setNewQty] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<'cash' | 'qris' | 'transfer'>('cash');
  const [newNote, setNewNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return expenses;
    const q = searchQuery.toLowerCase();
    return expenses.filter(
      (e) =>
        e.item_name.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }, [expenses, searchQuery]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((acc, e) => acc + e.total_price, 0);
  }, [expenses]);

  const categories = ['Snack', 'Sarpras', 'Transport', 'Akomodasi', 'Dekorasi', 'Lain-lain', 'Umum'];

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const totalCount = filteredExpenses.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const paginatedExpenses = useMemo(() => {
    return filteredExpenses.slice(startIndex, endIndex);
  }, [filteredExpenses, startIndex, endIndex]);

  useEffect(() => {
    const fetchExpenses = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/keuangan/expenses');
        const data = await res.json();
        if (res.ok && data.expenses) {
          setExpenses(data.expenses);
        }
      } catch (err) {
        console.error('Fetch expenses error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExpenses();
  }, []);

  const handleOpenNewExpense = () => {
    setEditingExpense(null);
    setNewCategory('');
    setNewItem('');
    setNewQty('');
    setNewPrice('');
    setNewPaymentMethod('cash');
    setNewNote('');
    setIsAdding(true);
  };

  const handleEditExpense = (e: Expense) => {
    setEditingExpense(e);
    setNewCategory(e.category);
    setNewItem(e.item_name);
    setNewQty(e.qty.toString());
    setNewPrice(e.price_per_unit.toString());
    setNewPaymentMethod(e.payment_method);
    setNewNote(e.note || '');
    setIsAdding(true);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data pengeluaran ini?')) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/keuangan/expenses?id=${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok && data.success) {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
      } else {
        alert(data.error || 'Gagal menghapus pengeluaran');
      }
    } catch {
      alert('Gagal terhubung ke server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory || !newItem.trim() || !newQty || !newPrice) return;

    setIsLoading(true);
    try {
      const isEdit = !!editingExpense;
      const res = isEdit
        ? await fetch('/api/keuangan/expenses', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: editingExpense.id,
              category: newCategory,
              item_name: newItem.trim(),
              qty: Number(newQty),
              price_per_unit: Number(newPrice),
              payment_method: newPaymentMethod,
              note: newNote.trim() || null,
            }),
          })
        : await fetch('/api/keuangan/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              category: newCategory,
              item_name: newItem.trim(),
              qty: Number(newQty),
              price_per_unit: Number(newPrice),
              payment_method: newPaymentMethod,
              note: newNote.trim() || null,
            }),
          });

      const data = await res.json();

      if (res.ok && data.success) {
        if (isEdit) {
          setExpenses((prev) =>
            prev.map((item) => (item.id === data.expense.id ? data.expense : item))
          );
        } else {
          setExpenses((prev) => [data.expense, ...prev]);
        }
        setNewCategory('');
        setNewItem('');
        setNewQty('');
        setNewPrice('');
        setNewNote('');
        setEditingExpense(null);
        setIsAdding(false);
      } else {
        alert(data.error || 'Gagal menyimpan pengeluaran');
      }
    } catch {
      alert('Gagal terhubung ke server');
    } finally {
      setIsLoading(false);
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Daftar Pengeluaran Biaya</h2>
          <p className="text-xs text-slate-500 font-medium">Pencatatan pengeluaran operasional & komite acara</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNewExpense}
            className="px-4 py-2 rounded-xl bg-[#E70013] text-white font-bold text-xs shadow-md hover:bg-[#E70013]/90 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Pengeluaran Baru
          </button>
        </div>
      </div>

      {/* Modern Summary Stat Banner */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-700 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white/15 backdrop-blur-md rounded-xl text-white border border-white/20">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-100">Total Pengeluaran Biaya</span>
            <p className="text-2xl sm:text-3xl font-black text-white">{formatRupiah(totalExpenses)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-white bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20">
          <span>{expenses.length} Transaksi Biaya</span>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari item atau kategori..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#E70013] focus:outline-none transition-all text-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs text-slate-500 font-medium">Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value={10}>10 per hlm</option>
              <option value={25}>25 per hlm</option>
              <option value={50}>50 per hlm</option>
            </select>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          </div>
        </div>

        {/* Table Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 font-bold text-slate-700">Item</th>
                <th className="p-4 font-bold text-slate-700">Kategori</th>
                <th className="p-4 font-bold text-slate-700 text-right">Jumlah</th>
                <th className="p-4 font-bold text-slate-700 text-right">Harga Satuan</th>
                <th className="p-4 font-bold text-slate-700 text-right">Harga Total</th>
                <th className="p-4 font-bold text-slate-700">Tgl Beli</th>
                <th className="p-4 font-bold text-slate-700">Bayar</th>
                <th className="p-4 font-bold text-slate-700 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    <p className="text-lg font-semibold">Belum ada data pengeluaran biaya.</p>
                    <p className="text-xs mt-2">Klik &quot;Pengeluaran Baru&quot; untuk menambahkan biaya.</p>
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-900">{e.item_name}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold capitalize">
                        {e.category}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 text-right">{e.qty} unit</td>
                    <td className="p-4 text-slate-600 text-right">{formatRupiah(e.price_per_unit)}</td>
                    <td className="p-4 text-amber-700 font-bold text-right">{formatRupiah(e.total_price)}</td>
                    <td className="p-4 text-slate-500">{new Date(e.expense_date).toLocaleDateString('id-ID')}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold capitalize">
                        {e.payment_method}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditExpense(e)}
                          className="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Edit Pengeluaran"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(e.id)}
                          className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Hapus Pengeluaran"
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

        {/* Pagination Controls */}
        {totalCount > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-600">
            <span>
              Menampilkan <strong className="font-black text-slate-900">{startIndex + 1}</strong>–
              <strong className="font-black text-slate-900">{endIndex}</strong> dari{' '}
              <strong className="font-black text-slate-900">{totalCount}</strong> pengeluaran
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

      {/* Form Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900">
                {editingExpense ? 'Edit Pengeluaran Biaya' : 'Catat Pengeluaran Biaya'}
              </h3>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingExpense(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Kategori</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900"
                >
                  <option value="">Pilih kategori...</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Item</label>
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900"
                  placeholder="Contoh: Snack & Minuman"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Jumlah</label>
                  <input
                    type="number"
                    min="1"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900"
                    placeholder="Contoh: 50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900"
                    placeholder="Contoh: 15000"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Metode Bayar</label>
                <select
                  value={newPaymentMethod}
                  onChange={(e) => setNewPaymentMethod(e.target.value as 'cash' | 'qris' | 'transfer')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900"
                >
                  <option value="cash">Tunai</option>
                  <option value="qris">QRIS</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Catatan (opsional)</label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none h-20 resize-none text-slate-900"
                  placeholder="Catatan tambahan..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingExpense(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-[#E70013] text-white font-bold hover:bg-[#E70013]/90 flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingExpense ? 'Simpan Perubahan' : 'Simpan Pengeluaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

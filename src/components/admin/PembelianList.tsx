import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Loader2, X, Edit, Trash2, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { SIKUJA_EVENT_NAME } from '@/lib/storage';

interface Purchase {
  id: string;
  supplier_name: string;
  item_name: string;
  qty: number;
  price_per_unit: number;
  total_price: number;
  purchase_date: string;
  payment_method: 'cash' | 'qris' | 'transfer';
  note?: string | null;
}

export const PembelianList = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [newSupplier, setNewSupplier] = useState('');
  const [newItem, setNewItem] = useState('');
  const [newQty, setNewQty] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<'cash' | 'qris' | 'transfer'>('cash');
  const [newNote, setNewNote] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const totalSpent = useMemo(() => {
    return purchases.reduce((acc, p) => acc + p.total_price, 0);
  }, [purchases]);

  const filteredPurchases = useMemo(() => {
    if (!searchQuery.trim()) return purchases;
    const q = searchQuery.toLowerCase();
    return purchases.filter(
      (p) =>
        p.item_name.toLowerCase().includes(q) ||
        p.supplier_name.toLowerCase().includes(q)
    );
  }, [purchases, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  const totalCount = filteredPurchases.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const paginatedPurchases = useMemo(() => {
    return filteredPurchases.slice(startIndex, endIndex);
  }, [filteredPurchases, startIndex, endIndex]);

  useEffect(() => {
    const fetchPurchases = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/keuangan/purchases');
        const data = await res.json();
        if (res.ok && data.purchases) {
          setPurchases(data.purchases);
        }
      } catch (err) {
        console.error('Fetch purchases error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPurchases();
    window.addEventListener(SIKUJA_EVENT_NAME, fetchPurchases);
    return () => window.removeEventListener(SIKUJA_EVENT_NAME, fetchPurchases);
  }, []);

  const handleOpenNewPurchase = () => {
    setEditingPurchase(null);
    setNewSupplier('');
    setNewItem('');
    setNewQty('');
    setNewPrice('');
    setNewPaymentMethod('cash');
    setNewNote('');
    setIsAdding(true);
  };

  const handleEditPurchase = (p: Purchase) => {
    setEditingPurchase(p);
    setNewSupplier(p.supplier_name);
    setNewItem(p.item_name);
    setNewQty(p.qty.toString());
    setNewPrice(p.price_per_unit.toString());
    setNewPaymentMethod(p.payment_method);
    setNewNote(p.note || '');
    setIsAdding(true);
  };

  const handleDeletePurchase = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data pembelian ini?')) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/keuangan/purchases?id=${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok && data.success) {
        setPurchases((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(data.error || 'Gagal menghapus pembelian');
      }
    } catch (err) {
      alert('Gagal terhubung ke server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.trim() || !newItem.trim() || !newQty || !newPrice) return;

    setIsLoading(true);
    try {
      const isEdit = !!editingPurchase;
      const res = isEdit
        ? await fetch('/api/keuangan/purchases', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: editingPurchase.id,
              supplier_name: newSupplier.trim(),
              item_name: newItem.trim(),
              qty: Number(newQty),
              price_per_unit: Number(newPrice),
              payment_method: newPaymentMethod,
              note: newNote.trim() || null,
            }),
          })
        : await fetch('/api/keuangan/purchases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              supplier_name: newSupplier.trim(),
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
          setPurchases((prev) =>
            prev.map((p) => (p.id === data.purchase.id ? data.purchase : p))
          );
        } else {
          setPurchases((prev) => [data.purchase, ...prev]);
        }
        setNewSupplier('');
        setNewItem('');
        setNewQty('');
        setNewPrice('');
        setNewNote('');
        setEditingPurchase(null);
        setIsAdding(false);
      } else {
        alert(data.error || 'Gagal menyimpan pembelian');
      }
    } catch (err) {
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
          <h2 className="text-lg font-black text-slate-900">Daftar Pembelian Doorprize</h2>
          <p className="text-xs text-slate-500 font-medium">Pengadaan dan pengeluaran belanja hadiah doorprize</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNewPurchase}
            className="px-4 py-2 rounded-xl bg-[#E70013] text-white font-bold text-xs shadow-md hover:bg-[#E70013]/90 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Pembelian Baru
          </button>
        </div>
      </div>

      {/* Modern Summary Stat Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white/15 backdrop-blur-md rounded-xl text-white border border-white/20">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100">Total Belanja Doorprize</span>
            <p className="text-2xl sm:text-3xl font-black text-white">{formatRupiah(totalSpent)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-white bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20">
          <span>{purchases.length} Transaksi Pembelian</span>
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
              placeholder="Cari supplier atau item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#E70013] focus:outline-none transition-all text-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs text-slate-500 font-medium">Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value={10}>10 per hlm</option>
              <option value={25}>25 per hlm</option>
              <option value={50}>50 per hlm</option>
            </select>
            {(isSyncing || isLoading) && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          </div>
        </div>

        {/* Table Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 font-bold text-slate-700">Item</th>
                <th className="p-4 font-bold text-slate-700">Supplier</th>
                <th className="p-4 font-bold text-slate-700 text-right">Jumlah</th>
                <th className="p-4 font-bold text-slate-700 text-right">Harga Satuan</th>
                <th className="p-4 font-bold text-slate-700 text-right">Harga Total</th>
                <th className="p-4 font-bold text-slate-700">Tgl Beli</th>
                <th className="p-4 font-bold text-slate-700">Bayar</th>
                <th className="p-4 font-bold text-slate-700 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    <p className="text-lg font-semibold">Belum ada data pembelian doorprize.</p>
                    <p className="text-xs mt-2">Klik "Pembelian Baru" untuk menambahkan data.</p>
                  </td>
                </tr>
              ) : (
                paginatedPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-900">{p.item_name}</td>
                    <td className="p-4 text-slate-600">{p.supplier_name}</td>
                    <td className="p-4 text-slate-600 text-right">{p.qty} unit</td>
                    <td className="p-4 text-slate-600 text-right">{formatRupiah(p.price_per_unit)}</td>
                    <td className="p-4 text-blue-700 font-bold text-right">{formatRupiah(p.total_price)}</td>
                    <td className="p-4 text-slate-500">{new Date(p.purchase_date).toLocaleDateString('id-ID')}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold capitalize">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditPurchase(p)}
                          className="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Edit Pembelian"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePurchase(p.id)}
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

        {/* Pagination Controls */}
        {totalCount > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-600">
            <span>
              Menampilkan <strong className="font-black text-slate-900">{startIndex + 1}</strong>–
              <strong className="font-black text-slate-900">{endIndex}</strong> dari{' '}
              <strong className="font-black text-slate-900">{totalCount}</strong> pembelian
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
                {editingPurchase ? 'Edit Pembelian Doorprize' : 'Tambah Pembelian Doorprize'}
              </h3>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingPurchase(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Supplier</label>
                <input
                  type="text"
                  value={newSupplier}
                  onChange={(e) => setNewSupplier(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900"
                  placeholder="Nama supplier..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Item</label>
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900"
                  placeholder="Nama item..."
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
                    placeholder="Contoh: 2"
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
                    placeholder="Contoh: 1750000"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none h-24 resize-none text-slate-900"
                  placeholder="Catatan tambahan..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingPurchase(null);
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
                  {editingPurchase ? 'Simpan Perubahan' : 'Simpan Pembelian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

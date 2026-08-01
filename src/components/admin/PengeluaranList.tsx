import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Download, Search, Loader2, X } from 'lucide-react';

export const PengeluaranList = () => {
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
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newItem, setNewItem] = useState('');
  const [newQty, setNewQty] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<'cash' | 'qris' | 'transfer'>('cash');
  const [newNote, setNewNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory || !newItem.trim() || !newQty || !newPrice) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/keuangan/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newCategory,
          item_name: newItem,
          qty: Number(newQty),
          price_per_unit: Number(newPrice),
          payment_method: newPaymentMethod,
          note: newNote.trim() || null,
        }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setExpenses((prev) => [data.expense, ...prev]);
        setNewCategory('');
        setNewItem('');
        setNewQty('');
        setNewPrice('');
        setNewNote('');
        setIsAdding(false);
      } else {
        alert(data.error || 'Gagal menambahkan pengeluaran');
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
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-black text-slate-900">Daftar Pengeluaran Biaya</h2>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-xs hover:border-slate-300 transition-colors flex items-center gap-1.5">
            <Download className="w-4 h-4" />
            Ekspor CSV
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 rounded-xl bg-[#E70013] text-white font-bold text-xs shadow-md hover:bg-[#E70013]/90 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Pengeluaran Baru
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari item atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#E70013] focus:outline-none transition-all"
            />
          </div>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
        </div>

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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <p className="text-lg font-semibold">Belum ada data pengeluaran biaya.</p>
                    <p className="text-xs mt-2">Klik "Pengeluaran Baru" untuk menambahkan biaya.</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
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
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-50">
              <tr>
                <td colSpan={4} className="p-4 font-bold text-slate-700 text-right">Total Pengeluaran:</td>
                <td className="p-4 text-2xl font-black text-amber-700 text-right">{formatRupiah(totalExpenses)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900">Catat Pengeluaran Biaya</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Kategori</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none"
                    placeholder="Contoh: 15000"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Metode Bayar</label>
                <select
                  value={newPaymentMethod}
                  onChange={(e) => setNewPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none h-20 resize-none"
                  placeholder="Catatan tambahan..."
                />
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
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
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

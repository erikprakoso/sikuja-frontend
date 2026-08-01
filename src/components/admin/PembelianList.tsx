import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Download, Search, Loader2, X } from 'lucide-react';
import { syncFromSupabase, SIKUJA_EVENT_NAME } from '@/lib/storage';

export const PembelianList = () => {
  interface Purchase {
    id: string;
    supplier_name: string;
    item_name: string;
    qty: number;
    price_per_unit: number;
    total_price: number;
    purchase_date: string;
    payment_method: 'cash' | 'qris' | 'transfer';
  }
  
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newSupplier, setNewSupplier] = useState('');
  const [newItem, setNewItem] = useState('');
  const [newQty, setNewQty] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<'cash' | 'qris' | 'transfer'>('cash');
  const [newNote, setNewNote] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.trim() || !newItem.trim() || !newQty || !newPrice) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/keuangan/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_name: newSupplier,
          item_name: newItem,
          qty: Number(newQty),
          price_per_unit: Number(newPrice),
          payment_method: newPaymentMethod,
          note: newNote,
        }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setPurchases((prev) => [data.purchase, ...prev]);
        setNewSupplier('');
        setNewItem('');
        setNewQty('');
        setNewPrice('');
        setNewNote('');
        setIsAdding(false);
      } else {
        alert(data.error || 'Gagal menambahkan pembelian');
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
        <h2 className="text-lg font-black text-slate-900">Daftar Pembelian Doorprize</h2>
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
            Pembelian Baru
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari supplier atau item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#E70013] focus:outline-none transition-all"
            />
          </div>
          {isSyncing && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
        </div>

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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <p className="text-lg font-semibold">Belum ada data pembelian doorprize.</p>
                    <p className="text-xs mt-2">Form pembelian dan API belum diimplementasi.</p>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
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
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-50">
              <tr>
                <td colSpan={4} className="p-4 font-bold text-slate-700 text-right">Total Belanja:</td>
                <td className="p-4 text-2xl font-black text-blue-700 text-right">{formatRupiah(totalSpent)}</td>
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
              <h3 className="text-lg font-black text-slate-900">Tambah Pembelian Doorprize</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddPurchase} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Supplier</label>
                <input
                  type="text"
                  value={newSupplier}
                  onChange={(e) => setNewSupplier(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none"
                    placeholder="Contoh: 1750000"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none h-24 resize-none"
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
                  Simpan Pembelian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

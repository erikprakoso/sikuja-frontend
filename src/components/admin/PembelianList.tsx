import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Download, Search, Loader2 } from 'lucide-react';
import { syncFromSupabase, SIKUJA_EVENT_NAME } from '@/lib/storage';

interface Purchase {
  id: string;
  supplier_name: string;
  item_name: string;
  qty: number;
  price_per_unit: number;
  total_price: number;
  purchase_date: string;
  payment_method: 'cash' | 'qris' | 'transfer';
  note?: string;
  created_at: string;
}

export const PembelianList = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

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
    syncFromSupabase().then(() => setIsSyncing(false));
    window.addEventListener(SIKUJA_EVENT_NAME, () => setIsSyncing(false));
    return () => window.removeEventListener(SIKUJA_EVENT_NAME, () => setIsSyncing(false));
  }, []);

  useEffect(() => {
    // TODO: Fetch dari Supabase /api/keuangan/purchases
    // Mock data untuk sekarang:
    setPurchases([
      {
        id: 'p1',
        supplier_name: 'Toko Sepeda Jaya',
        item_name: 'Sepeda Gunung MTB',
        qty: 2,
        price_per_unit: 1750000,
        total_price: 3500000,
        purchase_date: '2026-07-28',
        payment_method: 'cash',
        created_at: '2026-07-28T10:00:00Z',
      },
    ]);
  }, []);

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
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Belum ada data pembelian.
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
    </div>
  );
};

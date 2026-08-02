import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Loader2, X, Edit, Trash2, ChevronLeft, ChevronRight, ShoppingBag, Gift, Package, Trophy, PackageCheck, AlertCircle } from 'lucide-react';
import { SIKUJA_EVENT_NAME, getStoredTransactions, getStoredDrawResults, computePrizesFromPurchases } from '@/lib/storage';
import { Purchase, DrawResult } from '@/types';

export const PembelianList = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [drawResults, setDrawResults] = useState<DrawResult[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  
  const [newItem, setNewItem] = useState('');
  const [newQty, setNewQty] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>(''); // Raw numeric string
  const [isDoorprize, setIsDoorprize] = useState<boolean>(true);
  const [fundingSource, setFundingSource] = useState<'donasi' | 'penjualan_kupon'>('donasi');
  const [newNote, setNewNote] = useState('');

  const doorprizePrizes = useMemo(() => {
    return computePrizesFromPurchases(purchases, drawResults);
  }, [purchases, drawResults]);

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const totalSpent = useMemo(() => {
    return purchases.reduce((acc, p) => acc + p.total_price, 0);
  }, [purchases]);

  const totalSpentDonations = useMemo(() => {
    return purchases
      .filter((p) => p.funding_source !== 'penjualan_kupon')
      .reduce((acc, p) => acc + p.total_price, 0);
  }, [purchases]);

  const totalSpentVouchers = useMemo(() => {
    return purchases
      .filter((p) => p.funding_source === 'penjualan_kupon')
      .reduce((acc, p) => acc + p.total_price, 0);
  }, [purchases]);

  const filteredPurchases = useMemo(() => {
    if (!searchQuery.trim()) return purchases;
    const q = searchQuery.toLowerCase();
    return purchases.filter(
      (p) => p.item_name.toLowerCase().includes(q)
    );
  }, [purchases, searchQuery]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const totalCount = filteredPurchases.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const paginatedPurchases = useMemo(() => {
    return filteredPurchases.slice(startIndex, endIndex);
  }, [filteredPurchases, startIndex, endIndex]);

  const [totalDonations, setTotalDonations] = useState(0);
  const [voucherSales, setVoucherSales] = useState(0);

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
    const fetchOverallStats = async () => {
      try {
        const donRes = await fetch('/api/keuangan/donasi?aggregate=true');
        const donData = await donRes.json();
        if (donRes.ok && donData.aggregate) {
          setTotalDonations(donData.aggregate.total ?? 0);
        }
        const transactions = getStoredTransactions();
        setVoucherSales(transactions.reduce((acc, tx) => acc + (tx.total_harga || 0), 0));
      } catch (err) {
        console.error('Fetch overall stats error:', err);
      }
    };
    const loadDrawResults = () => {
      setDrawResults(getStoredDrawResults());
    };
    const refresh = () => {
      fetchPurchases();
      fetchOverallStats();
      loadDrawResults();
    };
    refresh();

    window.addEventListener(SIKUJA_EVENT_NAME, refresh);
  }, []);

  const sisaDonasi = totalDonations - totalSpentDonations;
  const sisaKupon = voucherSales - totalSpentVouchers;
  const sisaKas = sisaDonasi + sisaKupon;

  // Modal Balance Validation
  const currentAvailableBalance = useMemo(() => {
    const rawBalance = fundingSource === 'donasi' ? sisaDonasi : sisaKupon;
    // Add back the item's previous price if editing an existing purchase from the same funding source
    const currentItemOldPrice = (editingPurchase && (editingPurchase.funding_source || 'donasi') === fundingSource)
      ? editingPurchase.total_price
      : 0;
    return rawBalance + currentItemOldPrice;
  }, [fundingSource, sisaDonasi, sisaKupon, editingPurchase]);

  const calculatedTotalPrice = useMemo(() => {
    const qty = parseInt(newQty, 10);
    const price = parseInt(newPrice, 10);
    if (isNaN(qty) || isNaN(price) || qty <= 0 || price <= 0) return 0;
    return qty * price;
  }, [newQty, newPrice]);

  const isInsufficientBalance = useMemo(() => {
    if (currentAvailableBalance <= 0) return true;
    if (calculatedTotalPrice > currentAvailableBalance) return true;
    return false;
  }, [currentAvailableBalance, calculatedTotalPrice]);

  const handleOpenNewPurchase = () => {
    if (totalDonations <= 0 && voucherSales <= 0) {
      alert('Belum ada Pemasukan Donasi/Sponsor maupun Penjualan Kupon (Total Saldo Rp 0).\n\nAnda belum bisa membuat pengeluaran. Harap catat Pemasukan Donasi atau Penjualan Kupon terlebih dahulu!');
      return;
    }
    setEditingPurchase(null);
    setNewItem('');
    setNewQty('');
    setNewPrice('');
    setIsDoorprize(true);
    // Pick default funding source that has available balance
    setFundingSource(sisaDonasi > 0 ? 'donasi' : 'penjualan_kupon');
    setNewNote('');
    setIsAdding(true);
  };

  const handleEditPurchase = (p: Purchase) => {
    setEditingPurchase(p);
    setNewItem(p.item_name);
    setNewQty(p.qty.toString());
    setNewPrice(p.price_per_unit.toString());
    setIsDoorprize(typeof p.is_doorprize === 'boolean' ? p.is_doorprize : true);
    setFundingSource(p.funding_source === 'penjualan_kupon' ? 'penjualan_kupon' : 'donasi');
    setNewNote(p.note || '');
    setIsAdding(true);
  };

  const handleDeletePurchase = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data pengeluaran ini?')) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/keuangan/purchases?id=${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok && data.success) {
        setPurchases((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(data.error || 'Gagal menghapus pengeluaran');
      }
    } catch {
      alert('Gagal terhubung ke server');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    setNewPrice(digitsOnly);
  };

  const formattedDisplayPrice = useMemo(() => {
    if (!newPrice) return '';
    const num = parseInt(newPrice, 10);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('id-ID').format(num);
  }, [newPrice]);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim() || !newQty || !newPrice) return;

    const sourceLabel = fundingSource === 'donasi' ? 'Donasi & Sponsor' : 'Hasil Penjualan Kupon';
    if (isInsufficientBalance) {
      alert(
        `Gagal menyimpan pengeluaran!\nSaldo Kas ${sourceLabel} tidak mencukupi.\n\n` +
        `Sisa Saldo Tersedia: ${formatRupiah(currentAvailableBalance)}\n` +
        `Total Belanja: ${formatRupiah(calculatedTotalPrice)}\n\n` +
        `Harap catat Pemasukan atau Penjualan Kupon terlebih dahulu!`
      );
      return;
    }

    setIsLoading(true);
    try {
      const isEdit = !!editingPurchase;
      const payload = {
        item_name: newItem.trim(),
        qty: Number(newQty),
        price_per_unit: Number(newPrice),
        is_doorprize: isDoorprize,
        funding_source: fundingSource,
        note: newNote.trim() || null,
      };

      const res = isEdit
        ? await fetch('/api/keuangan/purchases', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: editingPurchase.id,
              ...payload,
            }),
          })
        : await fetch('/api/keuangan/purchases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
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

        setNewItem('');
        setNewQty('');
        setNewPrice('');
        setNewNote('');
        setEditingPurchase(null);
        setIsAdding(false);
      } else {
        alert(data.error || 'Gagal menyimpan pembelian');
      }
    } catch {
      alert('Gagal terhubung ke server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Daftar Pengeluaran & Belanja</h2>
          <p className="text-xs text-slate-500 font-medium">Pengadaan barang doorprize maupun belanja operasional acara</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNewPurchase}
            className="px-4 py-2 rounded-xl bg-[#E70013] text-white font-bold text-xs shadow-md hover:bg-[#E70013]/90 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Pengeluaran Baru
          </button>
        </div>
      </div>

      {/* Modern Summary Stat Cards (Split Balances) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Pengeluaran */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Pengeluaran</span>
            <p className="text-xl font-black text-white mt-0.5">{formatRupiah(totalSpent)}</p>
            <span className="text-[10px] font-semibold text-slate-400 mt-0.5 block">{purchases.length} transaksi</span>
          </div>
          <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl text-white">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* Sisa Donasi / Sponsor */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-4 shadow-sm border border-blue-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100 block">Sisa Saldo Donasi/Sponsor</span>
            <p className="text-xl font-black text-white mt-0.5">{formatRupiah(sisaDonasi)}</p>
            <span className="text-[10px] font-medium text-blue-200 mt-0.5 block">
              Total Masuk: {formatRupiah(totalDonations)}
            </span>
          </div>
          <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl text-white">
            <Gift className="w-5 h-5" />
          </div>
        </div>

        {/* Sisa Penjualan Kupon */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-sm border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 block">Sisa Saldo Penjualan Kupon</span>
            <p className="text-xl font-black text-white mt-0.5">{formatRupiah(sisaKupon)}</p>
            <span className="text-[10px] font-medium text-emerald-200 mt-0.5 block">
              Total Masuk: {formatRupiah(voucherSales)}
            </span>
          </div>
          <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl text-white">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Total Sisa Kas Panitia */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-4 shadow-sm border border-amber-400/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-100 block">Total Sisa Kas Panitia</span>
            <p className="text-xl font-black text-white mt-0.5">{formatRupiah(sisaKas)}</p>
            <span className="text-[10px] font-medium text-amber-100 mt-0.5 block">
              Gabungan Seluruh Kas
            </span>
          </div>
          <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl text-white">
            <Trophy className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Kategori Hadiah Doorprize Section (Auto Computed) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#E70013]" />
              Status Kategori Hadiah Undian ({doorprizePrizes.length})
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Kategori & stok ini dihitung otomatis dari item bernilai <strong className="text-slate-800">Doorprize Undian</strong> di tabel bawah.
            </p>
          </div>
        </div>

        {doorprizePrizes.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
            <PackageCheck className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-800">Belum ada kategori hadiah undian.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tambah item dengan tipe <strong className="text-slate-700">Doorprize Undian</strong> untuk mendaftarkan hadiah ke panggung undian.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {doorprizePrizes.map((p) => (
              <div
                key={p.id}
                className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-2xs hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-slate-400">#{p.order_num}</span>
                    <span className="text-xs font-bold text-slate-900">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px]">
                    <p className="font-semibold text-slate-500">
                      Stok: <span className="font-mono font-bold text-[#E70013]">{p.stock} Unit</span>
                    </p>
                    <p className="font-semibold text-slate-500">
                      Terundi: <span className="font-mono font-bold text-emerald-600">{p.drawn_count}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama item barang..."
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
                <th className="p-4 font-bold text-slate-700">Item Barang</th>
                <th className="p-4 font-bold text-slate-700">Sumber Dana</th>
                <th className="p-4 font-bold text-slate-700">Tipe Barang</th>
                <th className="p-4 font-bold text-slate-700 text-right">Jumlah</th>
                <th className="p-4 font-bold text-slate-700 text-right">Harga Satuan</th>
                <th className="p-4 font-bold text-slate-700 text-right">Harga Total</th>
                <th className="p-4 font-bold text-slate-700">Tgl Beli</th>
                <th className="p-4 font-bold text-slate-700 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    <p className="text-lg font-semibold">Belum ada data pengeluaran & belanja.</p>
                    <p className="text-xs mt-2">Klik &quot;Pengeluaran Baru&quot; untuk menambahkan data.</p>
                  </td>
                </tr>
              ) : (
                paginatedPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-900">{p.item_name}</td>
                    <td className="p-4">
                      {p.funding_source === 'penjualan_kupon' ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold inline-flex items-center gap-1">
                          🎟️ Penjualan Kupon
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold inline-flex items-center gap-1">
                          🎁 Donasi & Sponsor
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {p.is_doorprize !== false ? (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold inline-flex items-center gap-1">
                          <Gift className="w-3.5 h-3.5 text-amber-600" />
                          Doorprize Undian
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold inline-flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-slate-500" />
                          Operasional
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-600 text-right font-semibold">{p.qty} unit</td>
                    <td className="p-4 text-slate-600 text-right">{formatRupiah(p.price_per_unit)}</td>
                    <td className="p-4 text-blue-700 font-bold text-right">{formatRupiah(p.total_price)}</td>
                    <td className="p-4 text-slate-500">{new Date(p.purchase_date).toLocaleDateString('id-ID')}</td>
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
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">
                {editingPurchase ? 'Edit Pengeluaran & Belanja' : 'Catat Pengeluaran & Belanja'}
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
                <label className="text-xs font-bold text-slate-600 mb-1 block">Nama Item Barang</label>
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900 font-bold"
                  placeholder="Contoh: Sepeda Listrik / Kipas Angin..."
                />
              </div>

              {/* Sumber Dana Selector */}
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Sumber Dana Pengeluaran</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFundingSource('donasi')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      fundingSource === 'donasi'
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>🎁 Donasi & Sponsor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFundingSource('penjualan_kupon')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      fundingSource === 'penjualan_kupon'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>🎟️ Penjualan Kupon</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                  {fundingSource === 'donasi'
                    ? `💰 Saldo Donasi Tersedia: ${formatRupiah(currentAvailableBalance)}`
                    : `🎫 Saldo Kupon Tersedia: ${formatRupiah(currentAvailableBalance)}`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Jumlah (Qty)</label>
                  <input
                    type="number"
                    min="1"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900 font-bold"
                    placeholder="Contoh: 2"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Harga Satuan (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">Rp</span>
                    <input
                      type="text"
                      value={formattedDisplayPrice}
                      onChange={handlePriceInputChange}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900 font-bold"
                      placeholder="1.750.000"
                    />
                  </div>
                </div>
              </div>

              {/* Total Price Auto Preview & Insufficient Balance Warning */}
              {calculatedTotalPrice > 0 && (
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  isInsufficientBalance
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}>
                  <span className="text-xs font-bold">Total Harga Belanja:</span>
                  <span className="text-base font-black">{formatRupiah(calculatedTotalPrice)}</span>
                </div>
              )}

              {isInsufficientBalance && (
                <div className="p-3 bg-red-100 border border-red-300 rounded-xl flex items-start gap-2.5 text-red-800 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-extrabold">Saldo Kas Tidak Mencukupi!</p>
                    <p className="font-medium text-[11px] mt-0.5">
                      Sisa Saldo Kas {fundingSource === 'donasi' ? 'Donasi & Sponsor' : 'Hasil Penjualan Kupon'} hanya {formatRupiah(currentAvailableBalance)}. Harap catat pemasukan terlebih dahulu sebelum membuat belanja.
                    </p>
                  </div>
                </div>
              )}

              {/* Apakah ini Doorprize? Selector */}
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Apakah barang ini dijadikan Doorprize Undian?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDoorprize(true)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isDoorprize
                        ? 'bg-[#E70013] border-[#E70013] text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Gift className="w-4 h-4" />
                    <span>Ya (Doorprize)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDoorprize(false)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      !isDoorprize
                        ? 'bg-slate-800 border-slate-800 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Tidak (Operasional)</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                  {isDoorprize
                    ? '🎁 Item akan otomatis terdaftar sebagai kategori & stok hadiah di panggung Undian.'
                    : '📦 Item dicatat sebagai pengadaan belanja barang biasa (tidak masuk list undian).'}
                </p>
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
                    setEditingPurchase(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading || isInsufficientBalance}
                  className="px-4 py-2 rounded-xl bg-[#E70013] text-white font-bold hover:bg-[#E70013]/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
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

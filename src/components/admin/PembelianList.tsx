import React, { useState, useMemo, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { SIKUJA_EVENT_NAME, getStoredTransactions, getStoredDrawResults, computePrizesFromPurchases, syncFromSupabase } from '@/lib/storage';
import { Purchase, DrawResult } from '@/types';
import { formatRupiah } from '@/lib/format';
import { PembelianStatsCards } from '@/components/admin/pembelian/PembelianStatsCards';
import { PembelianPrizeGrid } from '@/components/admin/pembelian/PembelianPrizeGrid';
import { PembelianToolbar } from '@/components/admin/pembelian/PembelianToolbar';
import { PembelianMobileCards } from '@/components/admin/pembelian/PembelianMobileCards';
import { PembelianTable } from '@/components/admin/pembelian/PembelianTable';
import { PembelianPagination } from '@/components/admin/pembelian/PembelianPagination';
import { PembelianFormModal, FundingSource } from '@/components/admin/pembelian/PembelianFormModal';

export const PembelianList = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [drawResults, setDrawResults] = useState<DrawResult[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  const [newItem, setNewItem] = useState('');
  const [newQty, setNewQty] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>(''); // Raw numeric string
  const [isDoorprize, setIsDoorprize] = useState<boolean>(true);
  const [fundingSource, setFundingSource] = useState<FundingSource>('donasi');
  const [newDonorName, setNewDonorName] = useState('');
  const [newNote, setNewNote] = useState('');

  const doorprizePrizes = useMemo(() => {
    return computePrizesFromPurchases(purchases, drawResults);
  }, [purchases, drawResults]);

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Sort states
  const [sortKey, setSortKey] = useState<'date' | 'total' | 'unit'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const purchaseTotals = useMemo(() => {
    let total = 0;
    let donasi = 0;
    let kupon = 0;
    let barang = 0;
    for (const p of purchases) {
      total += p.total_price;
      if (p.funding_source === 'penjualan_kupon') kupon += p.total_price;
      else if (p.funding_source === 'donasi_barang') barang += p.total_price;
      else donasi += p.total_price;
    }
    return { total, donasi, kupon, barang };
  }, [purchases]);

  const totalSpent = purchaseTotals.donasi + purchaseTotals.kupon;
  const totalSpentBarang = purchaseTotals.barang;
  const totalSpentDonations = purchaseTotals.donasi;
  const totalSpentVouchers = purchaseTotals.kupon;

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
  const sortedPurchases = useMemo(() => {
    const list = [...filteredPurchases];
    const dir = sortDir === 'desc' ? -1 : 1;
    list.sort((a, b) => {
      if (sortKey === 'total') {
        return (a.total_price - b.total_price) * dir;
      }
      if (sortKey === 'unit') {
        return (a.price_per_unit - b.price_per_unit) * dir;
      }
      return (new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime()) * dir;
    });
    return list;
  }, [filteredPurchases, sortKey, sortDir]);
  const paginatedPurchases = useMemo(() => {
    return sortedPurchases.slice(startIndex, endIndex);
  }, [sortedPurchases, startIndex, endIndex]);

  const handleSortChange = (value: string) => {
    const [key, dir] = value.split('-') as ['date' | 'total' | 'unit', 'asc' | 'desc'];
    setSortKey(key);
    setSortDir(dir);
    setCurrentPage(1);
  };

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
    // Sinkronkan data server (transactions & draw_results) ke localStorage dulu agar
    // saldo penjualan kupon & jumlah "Terundi" selalu akurat, lalu event akan me-refresh lagi.
    syncFromSupabase();

    window.addEventListener(SIKUJA_EVENT_NAME, refresh);
  }, []);

  const sisaDonasi = totalDonations - totalSpentDonations;
  const sisaKupon = voucherSales - totalSpentVouchers;
  const sisaKas = sisaDonasi + sisaKupon;

  // Modal Balance Validation
  const currentAvailableBalance = useMemo(() => {
    if (fundingSource === 'donasi_barang') return 0;
    const rawBalance = fundingSource === 'donasi' ? sisaDonasi : sisaKupon;
    // Add back the item's previous price if editing an existing purchase from the same funding source
    const currentItemOldPrice = (editingPurchase && (editingPurchase.funding_source || 'donasi') === fundingSource)
      ? editingPurchase.total_price
      : 0;
    return rawBalance + currentItemOldPrice;
  }, [fundingSource, sisaDonasi, sisaKupon, editingPurchase]);

  const calculatedTotalPrice = useMemo(() => {
    const qty = Number(newQty);
    const price = Number(newPrice);
    if (!Number.isFinite(qty) || !Number.isFinite(price) || qty <= 0 || price <= 0) return 0;
    return qty * price;
  }, [newQty, newPrice]);

  const isInsufficientBalance = useMemo(() => {
    if (fundingSource === 'donasi_barang') return false;
    if (currentAvailableBalance <= 0) return true;
    if (calculatedTotalPrice > currentAvailableBalance) return true;
    return false;
  }, [currentAvailableBalance, calculatedTotalPrice, fundingSource]);

  const handleOpenNewPurchase = () => {
    setEditingPurchase(null);
    setNewItem('');
    setNewQty('');
    setNewPrice('');
    setIsDoorprize(true);
    // Pick default funding source that has available balance
    setFundingSource(sisaDonasi > 0 ? 'donasi' : 'penjualan_kupon');
    setNewDonorName('');
    setNewNote('');
    setIsAdding(true);
  };

  const handleEditPurchase = (p: Purchase) => {
    setEditingPurchase(p);
    setNewItem(p.item_name);
    setNewQty(p.qty.toString());
    setNewPrice(p.price_per_unit.toString());
    setIsDoorprize(typeof p.is_doorprize === 'boolean' ? p.is_doorprize : true);
    setFundingSource(
      p.funding_source === 'penjualan_kupon' || p.funding_source === 'donasi_barang'
        ? p.funding_source
        : 'donasi'
    );
    setNewDonorName(p.donor_name || '');
    setNewNote(p.note || '');
    setIsAdding(true);
  };

  const handleCloseModal = () => {
    setIsAdding(false);
    setEditingPurchase(null);
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
    const num = Number(newPrice);
    if (!Number.isFinite(num)) return '';
    return new Intl.NumberFormat('id-ID').format(num);
  }, [newPrice]);

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim() || !newQty) return;

    const isInKind = fundingSource === 'donasi_barang';
    const sourceLabel = fundingSource === 'donasi' ? 'Donasi & Sponsor' : fundingSource === 'penjualan_kupon' ? 'Hasil Penjualan Kupon' : 'Donasi Barang (In-Kind)';

    if (isInKind && !newDonorName.trim()) {
      alert('Nama donatur wajib diisi untuk donasi barang (barang diberikan langsung oleh donatur).');
      return;
    }

    if (!isInKind && isInsufficientBalance) {
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
        price_per_unit: Number(newPrice || 0),
        is_doorprize: isDoorprize,
        funding_source: fundingSource,
        donor_name: isInKind ? newDonorName.trim() : null,
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
        setNewDonorName('');
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
      <PembelianStatsCards
        totalSpent={totalSpent}
        totalSpentBarang={totalSpentBarang}
        sisaDonasi={sisaDonasi}
        totalDonations={totalDonations}
        sisaKupon={sisaKupon}
        voucherSales={voucherSales}
        sisaKas={sisaKas}
        purchaseCount={purchases.length}
      />

      {/* Kategori Hadiah Doorprize Section (Auto Computed) */}
      <PembelianPrizeGrid prizes={doorprizePrizes} />

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Search & Filter Bar */}
        <PembelianToolbar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          sortValue={`${sortKey}-${sortDir}`}
          onSortChange={handleSortChange}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
        />

        {/* Mobile Card List */}
        <PembelianMobileCards
          purchases={paginatedPurchases}
          onEdit={handleEditPurchase}
          onDelete={handleDeletePurchase}
        />

        {/* Table Data */}
        <PembelianTable
          purchases={paginatedPurchases}
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={handleSortChange}
          onEdit={handleEditPurchase}
          onDelete={handleDeletePurchase}
        />

        {/* Pagination Controls */}
        <PembelianPagination
          totalCount={totalCount}
          startIndex={startIndex}
          endIndex={endIndex}
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Form Modal */}
      <PembelianFormModal
        isOpen={isAdding}
        editingPurchase={editingPurchase}
        isLoading={isLoading}
        item={newItem}
        onItemChange={setNewItem}
        qty={newQty}
        onQtyChange={setNewQty}
        priceDisplay={formattedDisplayPrice}
        onPriceInputChange={handlePriceInputChange}
        isDoorprize={isDoorprize}
        onIsDoorprizeChange={setIsDoorprize}
        fundingSource={fundingSource}
        onFundingSourceChange={setFundingSource}
        donorName={newDonorName}
        onDonorNameChange={setNewDonorName}
        note={newNote}
        onNoteChange={setNewNote}
        currentAvailableBalance={currentAvailableBalance}
        calculatedTotalPrice={calculatedTotalPrice}
        isInsufficientBalance={isInsufficientBalance}
        onClose={handleCloseModal}
        onSubmit={handleSavePurchase}
      />
    </div>
  );
};

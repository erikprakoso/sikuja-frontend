import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Loader2, X, Edit, Trash2, ChevronLeft, ChevronRight, TrendingUp, Wallet, ShoppingBag, ArrowUpDown } from 'lucide-react';
import { SIKUJA_EVENT_NAME } from '@/lib/storage';
import { Donation } from '@/types';

export const DonasiList = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  
  const [newDonorName, setNewDonorName] = useState('');
  const [newDonorPhone, setNewDonorPhone] = useState('');
  const [newAmount, setNewAmount] = useState<string>(''); // Raw numeric string
  const [newNote, setNewNote] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Sort states
  const [sortKey, setSortKey] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filteredDonations = useMemo(() => {
    if (!searchQuery.trim()) return donations;
    const q = searchQuery.toLowerCase();
    return donations.filter(
      (d: Donation) =>
        d.donor_name.toLowerCase().includes(q) ||
        (d.donor_phone || '').toLowerCase().includes(q) ||
        d.amount.toString().includes(q)
    );
  }, [donations, searchQuery]);

  const totalDonations = useMemo(() => {
    return donations.reduce((acc, d) => acc + d.amount, 0);
  }, [donations]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const totalCount = filteredDonations.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const sortedDonations = useMemo(() => {
    const list = [...filteredDonations];
    const dir = sortDir === 'desc' ? -1 : 1;
    list.sort((a, b) => {
      if (sortKey === 'amount') {
        return (a.amount - b.amount) * dir;
      }
      return (new Date(a.received_at).getTime() - new Date(b.received_at).getTime()) * dir;
    });
    return list;
  }, [filteredDonations, sortKey, sortDir]);
  const paginatedDonations = useMemo(() => {
    return sortedDonations.slice(startIndex, endIndex);
  }, [sortedDonations, startIndex, endIndex]);

  const handleSortChange = (value: string) => {
    const [key, dir] = value.split('-') as ['date' | 'amount', 'asc' | 'desc'];
    setSortKey(key);
    setSortDir(dir);
    setCurrentPage(1);
  };

  const [totalSpentDonations, setTotalSpentDonations] = useState(0);

  useEffect(() => {
    const fetchDonations = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/keuangan/donasi');
        const data = await res.json();
        if (res.ok && data.donations) {
          setDonations(data.donations);
        }
      } catch (err) {
        console.error('Fetch donations error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchOverallStats = async () => {
      try {
        const purRes = await fetch('/api/keuangan/purchases?aggregate=true');
        const purData = await purRes.json();
        if (purRes.ok && purData.aggregate) {
          setTotalSpentDonations(purData.aggregate.spent_donasi ?? 0);
        }
      } catch (err) {
        console.error('Fetch overall stats error:', err);
      }
    };

    const refresh = () => {
      fetchDonations();
      fetchOverallStats();
    };
    refresh();

    window.addEventListener(SIKUJA_EVENT_NAME, refresh);
  }, []);

  const sisaDonasi = totalDonations - totalSpentDonations;

  const handleOpenNewDonation = () => {
    setEditingDonation(null);
    setNewDonorName('');
    setNewDonorPhone('');
    setNewAmount('');
    setNewNote('');
    setIsAdding(true);
  };

  const handleEditDonation = (d: Donation) => {
    setEditingDonation(d);
    setNewDonorName(d.donor_name);
    setNewDonorPhone(d.donor_phone || '');
    setNewAmount(d.amount.toString());
    setNewNote(d.note || '');
    setIsAdding(true);
  };

  const handleDeleteDonation = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus donasi ini?')) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/keuangan/donasi?id=${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok && data.success) {
        setDonations((prev) => prev.filter((d) => d.id !== id));
      } else {
        alert(data.error || 'Gagal menghapus donasi');
      }
    } catch {
      alert('Gagal terhubung ke server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    setNewAmount(digitsOnly);
  };

  const formattedDisplayAmount = useMemo(() => {
    if (!newAmount) return '';
    const num = Number(newAmount);
    if (!Number.isFinite(num)) return '';
    return new Intl.NumberFormat('id-ID').format(num);
  }, [newAmount]);

  const handleSaveDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDonorName.trim() || !newAmount) return;
    if (Number(newAmount) <= 0) {
      alert('Nominal donasi harus lebih dari Rp 0.');
      return;
    }

    setIsLoading(true);
    try {
      const isEdit = !!editingDonation;
      const payload = {
        donor_name: newDonorName.trim(),
        donor_phone: newDonorPhone.trim() || null,
        amount: Number(newAmount),
        note: newNote.trim() || null,
      };

      const res = isEdit
        ? await fetch('/api/keuangan/donasi', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: editingDonation.id,
              ...payload,
            }),
          })
        : await fetch('/api/keuangan/donasi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      const data = await res.json();

      if (res.ok && data.success) {
        if (isEdit) {
          setDonations((prev) =>
            prev.map((d) => (d.id === data.donation.id ? data.donation : d))
          );
        } else {
          setDonations((prev) => [data.donation, ...prev]);
        }
        setNewDonorName('');
        setNewDonorPhone('');
        setNewAmount('');
        setNewNote('');
        setEditingDonation(null);
        setIsAdding(false);
      } else {
        alert(data.error || 'Gagal menyimpan donasi');
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
          <h2 className="text-lg font-black text-slate-900">Daftar Pemasukan & Sponsor</h2>
          <p className="text-xs text-slate-500 font-medium">Kelola seluruh donasi, bantuan dana, dan sponsor acara</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNewDonation}
            className="px-4 py-2 rounded-xl bg-[#E70013] text-white font-bold text-xs shadow-md hover:bg-[#E70013]/90 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Pemasukan Baru
          </button>
        </div>
      </div>

      {/* Summary Stat Cards (Specific to Incomes & Donations) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Pemasukan & Sponsor */}
        <div className="bg-linear-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-sm border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 block">Total Pemasukan & Sponsor</span>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{formatRupiah(totalDonations)}</p>
            <span className="text-[10px] font-semibold text-emerald-100 mt-0.5 block">{donations.length} transaksi penerimaan</span>
          </div>
          <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl text-white">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Total Terpakai untuk Pengeluaran Donasi */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pengeluaran Terpakai (Donasi)</span>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{formatRupiah(totalSpentDonations)}</p>
            <span className="text-[10px] font-semibold text-slate-400 mt-0.5 block">Belanja dari sumber Donasi</span>
          </div>
          <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl text-white">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* Sisa Saldo Donasi & Sponsor */}
        <div className="bg-linear-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-4 shadow-sm border border-blue-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100 block">Sisa Saldo Donasi & Sponsor</span>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{formatRupiah(sisaDonasi)}</p>
            <span className="text-[10px] font-semibold text-blue-200 mt-0.5 block">Saldo bersih Donasi & Sponsor</span>
          </div>
          <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl text-white">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama donatur atau nominal..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#E70013] focus:outline-none transition-all text-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Urutkan:</span>
            <select
              value={`${sortKey}-${sortDir}`}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="date-desc">Tanggal Terbaru</option>
              <option value="date-asc">Tanggal Terlama</option>
              <option value="amount-desc">Nominal Terbesar</option>
              <option value="amount-asc">Nominal Terkecil</option>
            </select>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Tampilkan:</span>
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
                <th className="p-4 font-bold text-slate-700">Donatur / Sponsor</th>
                <th
                  onClick={() => handleSortChange(sortKey === 'amount' && sortDir === 'desc' ? 'amount-asc' : 'amount-desc')}
                  className="p-4 font-bold text-slate-700 text-right cursor-pointer hover:text-[#E70013] transition-colors"
                >
                  <span className="inline-flex items-center gap-1">
                    Nominal (Rp)
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortKey === 'amount' ? 'text-[#E70013]' : 'text-slate-400'}`} />
                  </span>
                </th>
                <th
                  onClick={() => handleSortChange(sortKey === 'date' && sortDir === 'desc' ? 'date-asc' : 'date-desc')}
                  className="p-4 font-bold text-slate-700 cursor-pointer hover:text-[#E70013] transition-colors"
                >
                  <span className="inline-flex items-center gap-1">
                    Tanggal Diterima
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortKey === 'date' ? 'text-[#E70013]' : 'text-slate-400'}`} />
                  </span>
                </th>
                <th className="p-4 font-bold text-slate-700">Catatan</th>
                <th className="p-4 font-bold text-slate-700 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedDonations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    <p className="text-lg font-semibold">Belum ada data pemasukan donasi.</p>
                    <p className="text-xs mt-2">Klik &quot;Pemasukan Baru&quot; untuk menambahkan data donatur.</p>
                  </td>
                </tr>
              ) : (
                paginatedDonations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      <div>
                        <p>{d.donor_name}</p>
                        {d.donor_phone && (
                          <p className="text-xs text-slate-500 font-normal">{d.donor_phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-emerald-600 font-extrabold text-right">
                      {formatRupiah(d.amount)}
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(d.received_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="p-4 text-slate-600 italic">
                      {d.note || '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditDonation(d)}
                          className="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Edit Donasi"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDonation(d.id)}
                          className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Hapus Donasi"
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
              <strong className="font-black text-slate-900">{totalCount}</strong> donasi
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
                {editingDonation ? 'Edit Pemasukan Donasi' : 'Tambah Pemasukan Donasi Baru'}
              </h3>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingDonation(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDonation} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Nama Donatur / Sponsor</label>
                <input
                  type="text"
                  value={newDonorName}
                  onChange={(e) => setNewDonorName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900 font-bold"
                  placeholder="Contoh: H. Ahmad / PT Sinar Mas"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Nomor WhatsApp / HP (opsional)</label>
                <input
                  type="text"
                  value={newDonorPhone}
                  onChange={(e) => setNewDonorPhone(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900"
                  placeholder="Contoh: 081234567890"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Nominal Donasi (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">Rp</span>
                  <input
                    type="text"
                    value={formattedDisplayAmount}
                    onChange={handleAmountInputChange}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900 font-bold text-base"
                    placeholder="1.000.000"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Catatan / Keterangan (opsional)</label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none h-20 resize-none text-slate-900"
                  placeholder="Keterangan bantuan / bentuk barang yang dinilai uang..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingDonation(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !newDonorName.trim() || !newAmount || Number(newAmount) <= 0}
                  className="px-4 py-2 rounded-xl bg-[#E70013] text-white font-bold hover:bg-[#E70013]/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingDonation ? 'Simpan Perubahan' : 'Simpan Donasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

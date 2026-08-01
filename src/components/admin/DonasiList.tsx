import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Loader2, X, Edit, Trash2, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';

interface Donation {
  id: string;
  donor_name: string;
  donor_phone: string | null;
  amount: number;
  type?: 'tunai' | 'non-tunai';
  source?: string;
  status: 'diterima';
  received_at: string;
  note: string | null;
}

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

  const filteredDonations = useMemo(() => {
    if (!searchQuery.trim()) return donations;
    const q = searchQuery.toLowerCase();
    return donations.filter(
      (d: Donation) =>
        d.donor_name.toLowerCase().includes(q) ||
        d.amount.toString().includes(q)
    );
  }, [donations, searchQuery]);

  const totalDonations = useMemo(() => {
    return donations.reduce((acc, d) => acc + d.amount, 0);
  }, [donations]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  const totalCount = filteredDonations.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const paginatedDonations = useMemo(() => {
    return filteredDonations.slice(startIndex, endIndex);
  }, [filteredDonations, startIndex, endIndex]);

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
    fetchDonations();
  }, []);

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
    } catch (err) {
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
    const num = parseInt(newAmount, 10);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('id-ID').format(num);
  }, [newAmount]);

  const handleSaveDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDonorName.trim() || !newAmount) return;

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
          <h2 className="text-lg font-black text-slate-900">Daftar Donasi Masuk</h2>
          <p className="text-xs text-slate-500 font-medium">Kelola seluruh donasi dan sponsor acara</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNewDonation}
            className="px-4 py-2 rounded-xl bg-[#E70013] text-white font-bold text-xs shadow-md hover:bg-[#E70013]/90 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Donasi Baru
          </button>
        </div>
      </div>

      {/* Modern Summary Stat Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white/15 backdrop-blur-md rounded-xl text-white border border-white/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">Total Donasi Terkumpul</span>
            <p className="text-2xl sm:text-3xl font-black text-white">{formatRupiah(totalDonations)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-white bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20">
          <span>{donations.length} Transaksi Donasi</span>
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
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          </div>
        </div>

        {/* Table Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 font-bold text-slate-700">Nama Donatur</th>
                <th className="p-4 font-bold text-slate-700 text-right">Jumlah Donasi</th>
                <th className="p-4 font-bold text-slate-700">Tanggal</th>
                <th className="p-4 font-bold text-slate-700">Status</th>
                <th className="p-4 font-bold text-slate-700 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedDonations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    <p className="text-lg font-semibold">Belum ada data donasi masuk.</p>
                    <p className="text-xs mt-2">Klik "Donasi Baru" untuk menambahkan donasi.</p>
                  </td>
                </tr>
              ) : (
                paginatedDonations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-900">
                      {d.donor_name}
                      {d.donor_phone && (
                        <span className="block text-xs text-slate-400 font-normal">{d.donor_phone}</span>
                      )}
                    </td>
                    <td className="p-4 text-emerald-700 font-bold text-right">{formatRupiah(d.amount)}</td>
                    <td className="p-4 text-slate-500">{new Date(d.received_at).toLocaleDateString('id-ID')}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">Diterima</span>
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
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">
                {editingDonation ? 'Edit Donasi' : 'Catat Donasi Masuk'}
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
                <label className="text-xs font-bold text-slate-600 mb-1 block">Nama Donatur</label>
                <input
                  type="text"
                  value={newDonorName}
                  onChange={(e) => setNewDonorName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900 font-bold"
                  placeholder="Nama lengkap donatur..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">No HP (opsional)</label>
                <input
                  type="text"
                  value={newDonorPhone}
                  onChange={(e) => setNewDonorPhone(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900 font-bold"
                  placeholder="08123456789"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Jumlah Donasi (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">Rp</span>
                  <input
                    type="text"
                    value={formattedDisplayAmount}
                    onChange={handleAmountInputChange}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900 font-bold"
                    placeholder="500.000"
                  />
                </div>
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
                    setEditingDonation(null);
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

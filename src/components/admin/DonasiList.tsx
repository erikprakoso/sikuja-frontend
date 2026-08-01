import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Download, Search, Loader2, X, Edit, Trash2 } from 'lucide-react';

interface Donation {
  id: string;
  donor_name: string;
  donor_phone: string | null;
  amount: number;
  type: 'tunai' | 'non-tunai';
  source: string;
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
  const [newAmount, setNewAmount] = useState<string>('');
  const [newType, setNewType] = useState<'tunai' | 'non-tunai'>('tunai');
  const [newSource, setNewSource] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDonations = useMemo(() => {
    if (!searchQuery.trim()) return donations;
    const q = searchQuery.toLowerCase();
    return donations.filter(
      (d: Donation) =>
        d.donor_name.toLowerCase().includes(q) ||
        d.amount.toString().includes(q) ||
        (d.source && d.source.toLowerCase().includes(q))
    );
  }, [donations, searchQuery]);

  const totalDonations = useMemo(() => {
    return donations.reduce((acc, d) => acc + d.amount, 0);
  }, [donations]);

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
    setNewType('tunai');
    setNewSource('');
    setNewNote('');
    setIsAdding(true);
  };

  const handleEditDonation = (d: Donation) => {
    setEditingDonation(d);
    setNewDonorName(d.donor_name);
    setNewDonorPhone(d.donor_phone || '');
    setNewAmount(d.amount.toString());
    setNewType(d.type);
    setNewSource(d.source);
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

  const handleSaveDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDonorName.trim() || !newAmount) return;

    setIsLoading(true);
    try {
      const isEdit = !!editingDonation;
      const res = isEdit
        ? await fetch('/api/keuangan/donasi', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: editingDonation.id,
              donor_name: newDonorName.trim(),
              donor_phone: newDonorPhone.trim() || null,
              amount: Number(newAmount),
              type: newType,
              source: newSource.trim() || 'umum',
              note: newNote.trim() || null,
            }),
          })
        : await fetch('/api/keuangan/donasi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              donor_name: newDonorName.trim(),
              donor_phone: newDonorPhone.trim() || null,
              amount: Number(newAmount),
              type: newType,
              source: newSource.trim() || 'umum',
              note: newNote.trim() || null,
            }),
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
        setNewSource('');
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
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-black text-slate-900">Daftar Donasi Masuk</h2>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-xs hover:border-slate-300 transition-colors flex items-center gap-1.5">
            <Download className="w-4 h-4" />
            Ekspor CSV
          </button>
          <button
            onClick={handleOpenNewDonation}
            className="px-4 py-2 rounded-xl bg-[#E70013] text-white font-bold text-xs shadow-md hover:bg-[#E70013]/90 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Donasi Baru
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari donatur atau jumlah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#E70013] focus:outline-none transition-all text-slate-900"
            />
          </div>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 font-bold text-slate-700">Nama Donatur</th>
                <th className="p-4 font-bold text-slate-700 text-right">Jumlah</th>
                <th className="p-4 font-bold text-slate-700">Tipe</th>
                <th className="p-4 font-bold text-slate-700">Sumber</th>
                <th className="p-4 font-bold text-slate-700">Tanggal</th>
                <th className="p-4 font-bold text-slate-700">Status</th>
                <th className="p-4 font-bold text-slate-700 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDonations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <p className="text-lg font-semibold">Belum ada data donasi masuk.</p>
                    <p className="text-xs mt-2">Klik "Donasi Baru" untuk menambahkan donasi.</p>
                  </td>
                </tr>
              ) : (
                filteredDonations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-900">
                      {d.donor_name}
                      {d.donor_phone && (
                        <span className="block text-xs text-slate-400 font-normal">{d.donor_phone}</span>
                      )}
                    </td>
                    <td className="p-4 text-emerald-700 font-bold text-right">{formatRupiah(d.amount)}</td>
                    <td className="p-4 text-slate-600 capitalize">{d.type}</td>
                    <td className="p-4 text-slate-600">{d.source}</td>
                    <td className="p-4 text-slate-500">{new Date(d.received_at).toLocaleDateString('id-ID')}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">Diterima</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditDonation(d)}
                          className="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Edit Donasi"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDonation(d.id)}
                          className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
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
            <tfoot className="bg-slate-50">
              <tr>
                <td colSpan={1} className="p-4 font-bold text-slate-700 text-right">Total Donasi:</td>
                <td className="p-4 text-2xl font-black text-emerald-700 text-right">{formatRupiah(totalDonations)}</td>
                <td colSpan={5}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900"
                  placeholder="Nama lengkap..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">No HP (opsional)</label>
                <input
                  type="text"
                  value={newDonorPhone}
                  onChange={(e) => setNewDonorPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900"
                  placeholder="08123456789"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Jumlah Donasi (Rp)</label>
                <input
                  type="number"
                  min="1"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900"
                  placeholder="Contoh: 500000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Tipe</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as 'tunai' | 'non-tunai')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900"
                  >
                    <option value="tunai">Tunai</option>
                    <option value="non-tunai">Non-Tunai</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Sumber</label>
                  <input
                    type="text"
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900"
                    placeholder="Contoh: Umum / Corporate"
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

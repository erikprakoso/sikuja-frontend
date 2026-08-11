import React, { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { SIKUJA_EVENT_NAME } from '@/lib/storage';
import { Donation } from '@/types';
import { DonasiStatsCards } from '@/components/admin/donasi/DonasiStatsCards';
import { DonasiToolbar } from '@/components/admin/donasi/DonasiToolbar';
import { DonasiMobileCards } from '@/components/admin/donasi/DonasiMobileCards';
import { DonasiTable } from '@/components/admin/donasi/DonasiTable';
import { DonasiPagination } from '@/components/admin/donasi/DonasiPagination';
import { DonasiFormModal } from '@/components/admin/donasi/DonasiFormModal';

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

  const handleCloseModal = () => {
    setIsAdding(false);
    setEditingDonation(null);
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
      <DonasiStatsCards
        totalDonations={totalDonations}
        totalSpentDonations={totalSpentDonations}
        sisaDonasi={sisaDonasi}
        donationCount={donations.length}
      />

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Search & Filter Bar */}
        <DonasiToolbar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          sortValue={`${sortKey}-${sortDir}`}
          onSortChange={handleSortChange}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
        />

        {/* Mobile Card List */}
        <DonasiMobileCards
          donations={paginatedDonations}
          onEdit={handleEditDonation}
          onDelete={handleDeleteDonation}
        />

        {/* Table Data */}
        <DonasiTable
          donations={paginatedDonations}
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={handleSortChange}
          onEdit={handleEditDonation}
          onDelete={handleDeleteDonation}
        />

        {/* Pagination Controls */}
        <DonasiPagination
          totalCount={totalCount}
          startIndex={startIndex}
          endIndex={endIndex}
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Form Modal */}
      <DonasiFormModal
        isOpen={isAdding}
        editingDonation={editingDonation}
        isLoading={isLoading}
        donorName={newDonorName}
        onDonorNameChange={setNewDonorName}
        donorPhone={newDonorPhone}
        onDonorPhoneChange={setNewDonorPhone}
        amountDisplay={formattedDisplayAmount}
        onAmountInputChange={handleAmountInputChange}
        note={newNote}
        onNoteChange={setNewNote}
        onClose={handleCloseModal}
        onSubmit={handleSaveDonation}
      />
    </div>
  );
};

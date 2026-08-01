'use client';

import React, { useState, useEffect } from 'react';
import {
  getStoredVouchers,
  getStoredTransactions,
  getStoredPrizes,
  getStoredDrawResults,
  savePrizes,
  deletePrizeFromStore,
  syncFromSupabase,
  SIKUJA_EVENT_NAME,
} from '@/lib/storage';
import { Voucher, Transaction, Prize, DrawResult } from '@/types';

import { RequireAuth } from '@/components/auth/RequireAuth';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminStatCards } from '@/components/admin/AdminStatCards';
import { PrizeManagement } from '@/components/admin/PrizeManagement';
import { VoucherMasterTable } from '@/components/admin/VoucherMasterTable';

export default function AdminDashboardPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [drawResults, setDrawResults] = useState<DrawResult[]>([]);
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = () => {
    setVouchers(getStoredVouchers());
    setTransactions(getStoredTransactions());
    setPrizes(getStoredPrizes());
    setDrawResults(getStoredDrawResults());
  };

  useEffect(() => {
    syncFromSupabase().then(() => {
      loadData();
    });
    if (typeof window !== 'undefined') {
      window.addEventListener(SIKUJA_EVENT_NAME, loadData);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(SIKUJA_EVENT_NAME, loadData);
      }
    };
  }, []);

  const totalSales = vouchers.length;
  const totalFisik = vouchers.filter((v) => v.type === 'fisik').length;
  const totalNonFisik = vouchers.filter((v) => v.type === 'non-fisik').length;
  const totalCheckin = vouchers.filter((v) => v.status !== 'terbit').length;

  const persistPrizesToServer = async (updated: Prize[]) => {
    try {
      await fetch('/api/prizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prizes: updated }),
      });
    } catch (err) {
      console.error('Gagal menyimpan hadiah ke server:', err);
    }
  };



  const handleDeletePrize = async (prizeId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus kategori hadiah ini?')) {
      const updated = prizes.filter((p) => p.id !== prizeId);
      setPrizes(updated);
      await deletePrizeFromStore(prizeId);
      try {
        await fetch(`/api/prizes?prizeId=${encodeURIComponent(prizeId)}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Gagal menghapus hadiah dari server:', err);
      }
    }
  };

  const exportCSV = () => {
    const headers = ['Kode Voucher', 'Tipe', 'Status', 'ID Transaksi', 'Waktu Terbit', 'Waktu Checkin', 'Hadiah Won'];
    const rows = vouchers.map((v) => [
      v.code,
      v.type,
      v.status,
      v.transaction_id,
      v.created_at,
      v.checkin_at || '',
      v.prize_name || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_sikuja_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredVouchers = vouchers.filter((v) => {
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    const matchesQuery = !searchQuery.trim() || v.code.includes(searchQuery.trim());
    return matchesStatus && matchesQuery;
  });

  return (
    <RequireAuth roles={['admin']}>
    <div className="space-y-8 py-4 max-w-6xl mx-auto">
      {/* Header Title & Export Buttons */}
      <AdminHeader />

      {/* Summary Stat Cards */}
      <AdminStatCards
        totalSales={totalSales}
        totalFisik={totalFisik}
        totalNonFisik={totalNonFisik}
        totalCheckin={totalCheckin}
        drawResults={drawResults}
      />

      {/* Prize Management Section */}
      <PrizeManagement
        prizes={prizes}
        onDeletePrize={handleDeletePrize}
      />

      {/* Vouchers Master Table */}
      <VoucherMasterTable
        vouchers={filteredVouchers}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        setSearchQuery={setSearchQuery}
        setStatusFilter={setStatusFilter}
      />
    </div>
    </RequireAuth>
  );
}

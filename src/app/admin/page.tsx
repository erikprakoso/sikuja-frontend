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
  SIVOJA_EVENT_NAME,
} from '@/lib/storage';
import { Voucher, Transaction, Prize, DrawResult } from '@/types';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminStatCards } from '@/components/admin/AdminStatCards';
import { PrizeManagement } from '@/components/admin/PrizeManagement';
import { VoucherMasterTable } from '@/components/admin/VoucherMasterTable';
import { AdminPrintSheet } from '@/components/admin/AdminPrintSheet';

export default function AdminDashboardPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [drawResults, setDrawResults] = useState<DrawResult[]>([]);
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // New Prize Form Modal state
  const [showAddPrize, setShowAddPrize] = useState(false);
  const [newPrizeName, setNewPrizeName] = useState('');
  const [newPrizeStock, setNewPrizeStock] = useState<number | string>(1);

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
      window.addEventListener(SIVOJA_EVENT_NAME, loadData);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(SIVOJA_EVENT_NAME, loadData);
      }
    };
  }, []);

  const totalSales = vouchers.length;
  const totalFisik = vouchers.filter((v) => v.type === 'fisik').length;
  const totalNonFisik = vouchers.filter((v) => v.type === 'non-fisik').length;
  const totalCheckin = vouchers.filter((v) => v.status !== 'terbit').length;
  const totalDana = transactions.reduce((acc, t) => acc + t.total_harga, 0);

  const handleAddPrize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrizeName.trim()) return;

    const newPrize: Prize = {
      id: 'p_' + Date.now(),
      name: newPrizeName.trim(),
      stock: Number(newPrizeStock) || 1,
      drawn_count: 0,
      order_num: prizes.length + 1,
    };

    const updated = [...prizes, newPrize];
    savePrizes(updated);
    setPrizes(updated);
    setNewPrizeName('');
    setNewPrizeStock(1);
    setShowAddPrize(false);
  };

  const handleDeletePrize = async (prizeId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus hadiah ini dari daftar?')) {
      const updated = prizes.filter((p) => p.id !== prizeId);
      setPrizes(updated);
      await deletePrizeFromStore(prizeId);
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
    <div className="space-y-8 py-4 max-w-6xl mx-auto">
      {/* Header Title & Export Buttons */}
      <AdminHeader
        onPrint={() => window.print()}
        onExportCSV={exportCSV}
      />

      {/* Summary Stat Cards */}
      <AdminStatCards
        totalSales={totalSales}
        totalFisik={totalFisik}
        totalNonFisik={totalNonFisik}
        totalCheckin={totalCheckin}
        drawResults={drawResults}
        totalDana={totalDana}
      />

      {/* Prize Management Section */}
      <PrizeManagement
        prizes={prizes}
        showAddPrize={showAddPrize}
        newPrizeName={newPrizeName}
        newPrizeStock={newPrizeStock}
        setShowAddPrize={setShowAddPrize}
        setNewPrizeName={setNewPrizeName}
        setNewPrizeStock={setNewPrizeStock}
        onAddPrize={handleAddPrize}
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

      {/* Hidden Printable Area for Admin Master Voucher Printing */}
      <AdminPrintSheet vouchers={filteredVouchers} />
    </div>
  );
}

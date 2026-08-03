'use client';

import React, { useState, useEffect } from 'react';
import {
  getStoredVouchers,
  getStoredTransactions,
  getStoredDrawResults,
  syncFromSupabase,
  SIKUJA_EVENT_NAME,
} from '@/lib/storage';
import { Voucher, Transaction, DrawResult } from '@/types';

import { RequireAuth } from '@/components/auth/RequireAuth';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminStatCards } from '@/components/admin/AdminStatCards';
import { VoucherMasterTable } from '@/components/admin/VoucherMasterTable';

export default function AdminDashboardPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [drawResults, setDrawResults] = useState<DrawResult[]>([]);
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = () => {
    setVouchers(getStoredVouchers());
    setTransactions(getStoredTransactions());
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
  const totalCheckin = vouchers.filter((v) => v.status !== 'terbit' && v.status !== 'forfeited').length;
  const totalOmzet = transactions.reduce((acc, tx) => acc + (tx.total_harga || 0), 0);

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
        totalOmzet={totalOmzet}
      />

      {/* Vouchers Master Table */}
      <VoucherMasterTable
        vouchers={vouchers}
        transactions={transactions}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        setSearchQuery={setSearchQuery}
        setStatusFilter={setStatusFilter}
      />
    </div>
    </RequireAuth>
  );
}

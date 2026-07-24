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
import {
  ShieldCheck,
  TrendingUp,
  Ticket,
  QrCode,
  Trophy,
  Plus,
  Trash2,
  Download,
  Edit2,
  CheckCircle2,
  Search,
  Printer,
} from 'lucide-react';

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
    link.setAttribute('download', `rekap_sivoja_${new Date().toISOString().slice(0, 10)}.csv`);
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
      {/* Header Title & Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950 border border-purple-800 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Dashboard Admin & Rekapitulasi
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Laporan & Manajemen Event</h1>
          <p className="text-xs text-slate-400">
            Rekap otomatis penjualan, kelola daftar hadiah, dan unduh laporan CSV.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 transition-all border border-slate-700"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            🖨️ Cetak Lembaran Kupon
          </button>
          <button
            onClick={exportCSV}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md"
          >
            <Download className="w-4 h-4" />
            Unduh Rekap (CSV)
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Terjual</span>
          <p className="text-2xl font-black text-white mt-1">{totalSales} lembar</p>
          <span className="text-[11px] text-slate-500 block mt-1">{totalFisik} Fisik • {totalNonFisik} E-Voucher</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs font-bold text-slate-400 uppercase">Check-In Pos</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{totalCheckin} kode</p>
          <span className="text-[11px] text-slate-500 block mt-1">
            {((totalCheckin / (totalSales || 1)) * 100).toFixed(0)}% Partisipasi
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs font-bold text-slate-400 uppercase">Pemenang Ditarik</span>
          <p className="text-2xl font-black text-amber-400 mt-1">{drawResults.length} kode</p>
          <span className="text-[11px] text-slate-500 block mt-1">
            {drawResults.filter((r) => r.claimed).length} Diklaim
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Dana Kas</span>
          <p className="text-2xl font-black text-cyan-400 mt-1">
            Rp {totalDana.toLocaleString('id-ID')}
          </p>
          <span className="text-[11px] text-slate-500 block mt-1">Anonim & Terverifikasi</span>
        </div>
      </div>

      {/* Prize Management Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Manajemen Daftar Hadiah ({prizes.length})
          </h2>
          <button
            onClick={() => setShowAddPrize(!showAddPrize)}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Hadiah
          </button>
        </div>

        {showAddPrize && (
          <form onSubmit={handleAddPrize} className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Nama Hadiah (Contoh: Kipas Angin)..."
              value={newPrizeName}
              onChange={(e) => setNewPrizeName(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
              required
            />
            <input
              type="number"
              min={1}
              placeholder="Stok"
              value={newPrizeStock}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setNewPrizeStock('');
                } else {
                  const parsed = parseInt(val, 10);
                  setNewPrizeStock(isNaN(parsed) ? '' : parsed);
                }
              }}
              className="w-24 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold"
            >
              Simpan Hadiah
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {prizes.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
            >
              <div>
                <span className="text-[10px] text-amber-400 font-bold uppercase">Urutan #{p.order_num}</span>
                <p className="text-sm font-bold text-white">{p.name}</p>
                <p className="text-xs text-slate-400">
                  Ditarik: <strong className="text-white">{p.drawn_count}</strong> / {p.stock} unit
                </p>
              </div>
              <button
                onClick={() => handleDeletePrize(p.id)}
                className="p-2 rounded-lg bg-red-950/60 text-red-400 hover:bg-red-900 transition-colors"
                title="Hapus Hadiah"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Vouchers Master Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-red-400" />
            Master Data Voucher ({filteredVouchers.length})
          </h2>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <input
                type="text"
                placeholder="Cari kode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono"
              />
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200"
            >
              <option value="all">Semua Status</option>
              <option value="terbit">Terbit (Belum Checkin)</option>
              <option value="checkin">Check-in Pos</option>
              <option value="menang">Menang Undian</option>
              <option value="diklaim">Sudah Diklaim</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Kode 5-Digit</th>
                <th className="p-3">Tipe</th>
                <th className="p-3">Status</th>
                <th className="p-3">Hadiah (Jika Menang)</th>
                <th className="p-3">Waktu Terbit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredVouchers.slice(0, 50).map((v) => (
                <tr key={v.code} className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-white tracking-widest">{v.code}</td>
                  <td className="p-3 capitalize">{v.type}</td>
                  <td className="p-3 font-sans">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.status === 'checkin'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : v.status === 'menang'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : v.status === 'diklaim'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="p-3 font-sans text-slate-300">{v.prize_name || '-'}</td>
                  <td className="p-3 text-[11px] text-slate-400">
                    {new Date(v.created_at).toLocaleTimeString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden Printable Area for Admin Master Voucher Printing */}
      <div className="hidden print-area text-black font-sans">
        <div className="text-center pb-3 border-b-2 border-black mb-4">
          <h1 className="text-xl font-black uppercase">LEMBARAN KUPON VOUCHER JALAN SEHAT AGUSTUSAN 🇮🇩</h1>
          <p className="text-xs font-bold">Total Terbit: {filteredVouchers.length} Lembar Kode Voucher</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {filteredVouchers.map((v, idx) => (
            <div key={v.code} className="border-2 border-black p-3 text-center rounded-lg space-y-1">
              <div className="flex justify-between items-center text-[9px] font-bold border-b border-black pb-1">
                <span>SIKUJA 2026</span>
                <span className="uppercase">{v.type}</span>
              </div>
              <p className="text-[10px] font-bold mt-1">KODE VOUCHER #{idx + 1}</p>
              <div className="text-2xl font-black font-mono tracking-widest my-1">
                {v.code}
              </div>
              <p className="text-[8px] text-gray-700">Wajib Di-scan di Pos Rute Jalan Sehat</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

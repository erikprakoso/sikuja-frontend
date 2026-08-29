'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Ticket, Search, X, Clock, Phone, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { getStoredTransactions, getStoredVouchers, SIKUJA_EVENT_NAME, syncFromSupabase } from '@/lib/storage';
import { checkInTransactionBatch } from '@/lib/services/voucher';
import { Transaction, Voucher } from '@/types';

interface Row {
  tx: Transaction;
  total: number;
  terbit: number;
  checkin: number;
  menang: number;
  vouchersTerbit: Voucher[];
}

export const BelumCheckinFollowUp: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [resultMsg, setResultMsg] = useState<{ success: boolean; text: string } | null>(null);

  const refresh = () => {
    setTransactions(getStoredTransactions());
    setVouchers(getStoredVouchers());
  };

  useEffect(() => {
    refresh();
    window.addEventListener(SIKUJA_EVENT_NAME, refresh);
    return () => window.removeEventListener(SIKUJA_EVENT_NAME, refresh);
  }, []);

  const rows: Row[] = useMemo(() => {
    const voucherByTx = new Map<string, Voucher[]>();
    for (const v of vouchers) {
      const arr = voucherByTx.get(v.transaction_id) || [];
      arr.push(v);
      voucherByTx.set(v.transaction_id, arr);
    }

    const list: Row[] = [];
    for (const tx of transactions) {
      const vs = voucherByTx.get(tx.id) || [];
      const terbit = vs.filter((v) => v.status === 'terbit').length;
      if (terbit === 0) continue;
      const checkin = vs.filter((v) => v.status === 'checkin').length;
      const menang = vs.filter((v) => v.status === 'menang' || v.status === 'diklaim').length;
      list.push({
        tx,
        total: vs.length || (tx.qty_fisik || 0) + (tx.qty_non_fisik || 0),
        terbit,
        checkin,
        menang,
        vouchersTerbit: vs.filter((v) => v.status === 'terbit'),
      });
    }
    // terbaru dulu
    return list.sort((a, b) => new Date(b.tx.created_at).getTime() - new Date(a.tx.created_at).getTime());
  }, [transactions, vouchers]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const name = (r.tx.customer_name || '').toLowerCase();
      const phone = (r.tx.customer_phone || '').toLowerCase();
      const codes = r.vouchersTerbit.map((v) => v.code).join(' ').toLowerCase();
      return name.includes(q) || phone.includes(q) || codes.includes(q);
    });
  }, [rows, searchQuery]);

  const totalTerbitOrang = filtered.length;
  const totalTerbitKupon = filtered.reduce((acc, r) => acc + r.terbit, 0);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * pageSize;
  const end = Math.min(start + pageSize, filtered.length);
  const pageRows = filtered.slice(start, end);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
  };

  const handleVerify = async (txId: string) => {
    setVerifyingId(txId);
    setResultMsg(null);
    try {
      let feedback: { success: boolean; text: string } | null = null;
      try {
        const res = await fetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionId: txId }),
        });
        const data = await res.json();
        if (res.ok && data.success) feedback = { success: true, text: data.message || 'Checkin berhasil' };
        else if (data.error) feedback = { success: false, text: data.error };
      } catch {
        // offline fallback
      }
      if (!feedback) {
        const batchRes = checkInTransactionBatch(txId, 'pos-device-1', { exact: true });
        feedback = { success: batchRes.success, text: batchRes.message };
      }
      setResultMsg(feedback);
      if (feedback.success) {
        // refresh local + server sync biar row yang sudah checkin hilang (terbit==0)
        refresh();
        void syncFromSupabase().then(() => refresh());
        setTimeout(() => setResultMsg(null), 3000);
      }
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-amber-600" />
            Belum Checkpoint <span className="text-slate-400 font-bold">({totalTerbitOrang} orang • {totalTerbitKupon} kupon)</span>
          </h2>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold">
            <AlertCircle className="w-3.5 h-3.5" />
            Fokus terbit saja
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium">Daftar pembeli yang masih punya kupon status <span className="font-black text-slate-700">terbit</span> (belum checkpoint). Hubungi untuk konfirmasi lanjut/tidak.</p>

        {/* Search + page size */}
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-sm">
            <input
              type="text"
              placeholder="Cari nama, HP, atau kode kupon terbit..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-8 pr-9 py-2.5 bg-white border border-slate-300 rounded-xl text-sm sm:text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 placeholder-slate-400"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                aria-label="Hapus pencarian"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            aria-label="Jumlah per halaman"
            className="px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm sm:text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
          >
            <option value={10}>10 per hlm</option>
            <option value={25}>25 per hlm</option>
            <option value={50}>50 per hlm</option>
          </select>
        </div>
      </div>

      {resultMsg && (
        <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${resultMsg.success ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {resultMsg.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {resultMsg.text}
        </div>
      )}

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {pageRows.length > 0 ? (
          pageRows.map((r) => {
            const name = r.tx.customer_name || 'Tanpa Nama';
            const phone = r.tx.customer_phone || '-';
            const time = r.tx.created_at;
            const isExpanded = expandedId === r.tx.id;
            return (
              <div key={r.tx.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{name}</p>
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 font-mono font-semibold">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {phone}
                    </span>
                    <span className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(time).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="shrink-0 text-center rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
                    <div className="text-base font-black text-amber-700 leading-none">{r.terbit}</div>
                    <div className="text-[9px] font-bold uppercase tracking-wide text-amber-700/70">Belum</div>
                    <div className="text-[10px] font-semibold text-slate-500">dari {r.total}</div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold">
                  {r.checkin > 0 && <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">{r.checkin} sudah checkin</span>}
                  {r.menang > 0 && <span className="px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700">{r.menang} menang</span>}
                </div>
                {r.vouchersTerbit.length > 0 && (
                  <div className="mt-3">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : r.tx.id)}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
                    >
                      {isExpanded ? 'Sembunyikan kode' : `Lihat ${r.vouchersTerbit.length} kode terbit`}
                    </button>
                    {isExpanded && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {r.vouchersTerbit.map((v) => (
                          <span key={v.code} className="px-2 py-1 rounded-lg bg-slate-900 text-white text-xs font-mono font-bold tracking-widest">
                            {v.code}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={() => handleVerify(r.tx.id)}
                  disabled={verifyingId === r.tx.id}
                  className="mt-3 w-full py-2.5 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {verifyingId === r.tx.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {verifyingId === r.tx.id ? 'Memverifikasi...' : `Verifikasi Checkin (${r.terbit} kupon)`}
                </button>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-500">Tidak ada yang belum checkpoint 🎉</div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-xs text-slate-800">
          <thead className="bg-slate-900 text-white uppercase font-bold text-[10px]">
            <tr>
              <th className="p-3">Pembeli</th>
              <th className="p-3">Total</th>
              <th className="p-3">Belum (Terbit)</th>
              <th className="p-3">Sudah Checkin</th>
              <th className="p-3">Kode Terbit</th>
              <th className="p-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {pageRows.length > 0 ? (
              pageRows.map((r) => (
                <tr key={r.tx.id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{r.tx.customer_name || 'Tanpa Nama'}</div>
                    <div className="text-[11px] font-mono font-semibold text-slate-500">{r.tx.customer_phone || '-'}</div>
                    <div className="text-[11px] text-slate-400">{new Date(r.tx.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="p-3 font-black text-slate-900 text-center">{r.total}</td>
                  <td className="p-3 text-center">
                    <span className="inline-flex px-2.5 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-black">{r.terbit}</span>
                  </td>
                  <td className="p-3 text-center font-bold text-emerald-700">{r.checkin}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {r.vouchersTerbit.slice(0, 6).map((v) => (
                        <span key={v.code} className="px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono text-[11px] font-bold">
                          {v.code}
                        </span>
                      ))}
                      {r.vouchersTerbit.length > 6 && <span className="text-[11px] font-semibold text-slate-500">+{r.vouchersTerbit.length - 6} lagi</span>}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleVerify(r.tx.id)}
                      disabled={verifyingId === r.tx.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-black hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {verifyingId === r.tx.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {verifyingId === r.tx.id ? 'Proses...' : 'Verifikasi'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-6 text-center font-semibold text-slate-500">
                  Tidak ada yang belum checkpoint 🎉
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 text-xs font-semibold text-slate-600">
          <span className="text-[11px]">
            Menampilkan <strong className="text-slate-900">{start + 1}</strong>–<strong className="text-slate-900">{end}</strong> dari <strong className="text-slate-900">{filtered.length}</strong>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const vis = Math.min(5, totalPages);
                const startWin = Math.max(1, Math.min(safePage - Math.floor(vis / 2), totalPages - vis + 1));
                const n = startWin + i;
                return (
                  <button
                    key={n}
                    onClick={() => setCurrentPage(n)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold font-mono border cursor-pointer ${safePage === n ? 'bg-amber-600 border-amber-600 text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

'use client';

import React, { useState, useMemo } from 'react';
import { Transaction, Voucher } from '@/types';
import { Search, X, ChevronLeft, ChevronRight, Trophy, Ticket, Phone, Clock } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  vouchers: Voucher[];
}

export const TidakDapatDoorprizeTable: React.FC<Props> = ({ transactions, vouchers }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const voucherByTx = useMemo(() => {
    const map = new Map<string, Voucher[]>();
    for (const v of vouchers) {
      const arr = map.get(v.transaction_id) || [];
      arr.push(v);
      map.set(v.transaction_id, arr);
    }
    return map;
  }, [vouchers]);

  const rows = useMemo(() => {
    return transactions
      .map((tx) => {
        const vs = voucherByTx.get(tx.id) || [];
        const total = vs.length || (tx.qty_fisik || 0) + (tx.qty_non_fisik || 0);
        // Berdasarkan status klaim: 0 voucher menang/diklaim = tidak dapat doorprize sama sekali
        const menang = vs.filter((v) => v.status === 'menang' || v.status === 'diklaim').length;
        const checkin = vs.filter((v) => v.status === 'checkin').length;
        const terbit = vs.filter((v) => v.status === 'terbit').length;
        return { tx, vs, total, menang, checkin, terbit };
      })
      .filter((r) => r.menang === 0)
      .sort((a, b) => new Date(b.tx.created_at).getTime() - new Date(a.tx.created_at).getTime());
  }, [transactions, voucherByTx]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const name = (r.tx.customer_name || '').toLowerCase();
      const phone = (r.tx.customer_phone || '').toLowerCase();
      const token = (r.tx.token || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || token.includes(q);
    });
  }, [rows, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * pageSize;
  const end = Math.min(start + pageSize, filtered.length);
  const pageRows = filtered.slice(start, end);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-slate-400" />
          Tidak Dapat Doorprize <span className="text-slate-400 font-bold">({filtered.length} transaksi • {filtered.reduce((a, r) => a + r.total, 0)} kupon)</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium">Transaksi yang <span className="font-black text-slate-700">0 voucher menang/diklaim</span> — belum beruntung sama sekali.</p>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between pt-1">
          <div className="relative flex-1 lg:max-w-sm">
            <input
              type="text"
              placeholder="Cari nama, HP, atau token..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-9 py-2.5 bg-white border border-slate-300 rounded-xl text-sm sm:text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 placeholder-slate-400"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
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
            className="px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
          >
            <option value={10}>10 per hlm</option>
            <option value={25}>25 per hlm</option>
            <option value={50}>50 per hlm</option>
          </select>
        </div>
      </div>

      {/* Mobile */}
      <div className="grid gap-3 md:hidden">
        {pageRows.length > 0 ? (
          pageRows.map((r) => (
            <div key={r.tx.id} className="rounded-2xl border border-slate-200 p-4 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{r.tx.customer_name || 'Tanpa Nama'}</p>
                  <span className="flex items-center gap-1 text-[11px] text-slate-500 font-mono font-semibold">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {r.tx.customer_phone || '-'}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(r.tx.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="shrink-0 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-center">
                  <div className="text-sm font-black text-slate-900 leading-none">{r.total}</div>
                  <div className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Kupon</div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-bold">
                <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">{r.terbit} terbit</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">{r.checkin} checkin</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white">0 menang</span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-500">Semua transaksi sudah pernah menang 🎉</div>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-xs text-slate-800">
          <thead className="bg-slate-900 text-white uppercase font-bold text-[10px]">
            <tr>
              <th className="p-3">Pembeli</th>
              <th className="p-3 text-center">Total</th>
              <th className="p-3 text-center">Terbit</th>
              <th className="p-3 text-center">Checkin</th>
              <th className="p-3 text-center">Menang</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {pageRows.length > 0 ? (
              pageRows.map((r) => (
                <tr key={r.tx.id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{r.tx.customer_name || 'Tanpa Nama'}</div>
                    <div className="text-[11px] font-mono font-semibold text-slate-500">{r.tx.customer_phone || '-'}</div>
                  </td>
                  <td className="p-3 text-center font-black">{r.total}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold">{r.terbit}</span>
                  </td>
                  <td className="p-3 text-center font-bold text-emerald-700">{r.checkin}</td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-black">
                      <Ticket className="w-3 h-3" />0
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-6 text-center font-semibold text-slate-500">
                  Semua transaksi sudah pernah menang 🎉
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 text-xs font-semibold text-slate-600">
          <span className="text-[11px]">
            Menampilkan <strong className="text-slate-900">{start + 1}</strong>–<strong className="text-slate-900">{end}</strong> dari <strong className="text-slate-900">{filtered.length}</strong>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="p-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const vis = Math.min(5, totalPages);
                const s = Math.max(1, Math.min(safePage - Math.floor(vis / 2), totalPages - vis + 1));
                const n = s + i;
                return (
                  <button
                    key={n}
                    onClick={() => setCurrentPage(n)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold font-mono border cursor-pointer ${safePage === n ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="p-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

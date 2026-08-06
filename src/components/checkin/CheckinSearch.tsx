'use client';

import React from 'react';
import {
  Search,
  X,
  ChevronRight,
  ArrowLeft,
  Phone,
  Ticket,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
} from 'lucide-react';
import { TransactionMatch } from '@/lib/services/voucher';
import { VoucherStatus } from '@/types';

const STATUS_BADGE: Record<VoucherStatus, { label: string; cls: string }> = {
  terbit: { label: 'Belum', cls: 'bg-amber-100 text-amber-700' },
  checkin: { label: 'Sudah', cls: 'bg-emerald-100 text-emerald-700' },
  menang: { label: 'Menang', cls: 'bg-purple-100 text-purple-700' },
  diklaim: { label: 'Diklaim', cls: 'bg-indigo-100 text-indigo-700' },
  forfeited: { label: 'Gugur', cls: 'bg-slate-200 text-slate-500' },
};

function initials(name?: string): string {
  const words = (name || '').split(' - ')[0].split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
}

interface CheckinSearchProps {
  query: string;
  setQuery: (q: string) => void;
  matches: TransactionMatch[];
  selected: TransactionMatch | null;
  isProcessing: boolean;
  resultMessage: { success: boolean; text: string } | null;
  resultKey: number;
  onSelect: (match: TransactionMatch) => void;
  onBack: () => void;
  onVerify: () => void;
}

export const CheckinSearch: React.FC<CheckinSearchProps> = ({
  query,
  setQuery,
  matches,
  selected,
  isProcessing,
  resultMessage,
  resultKey,
  onSelect,
  onBack,
  onVerify,
}) => {
  return (
    <div className="space-y-3">
      {/* Section Label */}
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
        <Users className="w-4 h-4 text-[#E70013]" />
        Cari Pembeli
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && matches.length === 1) onSelect(matches[0]);
          }}
          placeholder="Cari nama pembeli / no. HP"
          autoComplete="off"
          className="w-full pl-12 pr-11 py-4 bg-white border-2 border-slate-200 focus:border-[#E70013] rounded-2xl text-base font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#E70013]/10 transition-all shadow-xs"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Hapus pencarian"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {selected ? (
        /* ── Detail Transaksi Terpilih ── */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-[#E70013] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>
              <button
                onClick={onVerify}
                disabled={selected.pendingVouchers === 0 || isProcessing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E70013] hover:bg-[#E70013]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm shadow-sm transition-all cursor-pointer active:scale-[0.98] border border-[#E70013] flex-shrink-0"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {isProcessing
                  ? 'Memproses...'
                  : selected.pendingVouchers > 0
                    ? `Verifikasi ${selected.pendingVouchers}`
                    : 'Selesai'}
              </button>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E70013] to-rose-400 text-white font-black text-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                {initials(selected.tx.customer_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-900 leading-tight break-words">
                  {selected.tx.customer_name || 'Tanpa Nama'}
                </p>
                {selected.tx.customer_phone && (
                  <p className="text-xs font-bold text-slate-600 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {selected.tx.customer_phone}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-black text-[#E70013] font-mono leading-none">
                  {selected.pendingVouchers}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                  Perlu Verifikasi
                </p>
              </div>
            </div>
          </div>

          {/* Hasil verifikasi langsung tampil di dalam kartu (tanpa scroll) */}
          {resultMessage && (
            <div
              key={resultKey}
              role="status"
              aria-live="polite"
              className={`px-4 py-3 text-sm font-bold flex items-start gap-2.5 animate-fade-in ${
                resultMessage.success
                  ? 'bg-emerald-900 text-white border-b border-emerald-800'
                  : 'bg-red-50 border-b border-red-200 text-red-700'
              }`}
            >
              {resultMessage.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <span>{resultMessage.text}</span>
            </div>
          )}

          {/* Daftar Voucher */}
          <div className="divide-y divide-slate-100 max-h-[42vh] overflow-y-auto">
            {selected.vouchers.map((v) => (
              <div key={v.code} className="flex items-center justify-between px-4 py-2.5 gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Ticket className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  <span className="font-mono font-bold text-slate-900">{v.code}</span>
                  <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 flex-shrink-0">
                    {v.type === 'fisik' ? 'Fisik' : 'Digital'}
                  </span>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_BADGE[v.status].cls}`}>
                  {STATUS_BADGE[v.status].label}
                </span>
              </div>
            ))}
            {selected.vouchers.length === 0 && (
              <p className="px-4 py-6 text-center text-sm font-semibold text-slate-400">
                Belum ada kupon terdaftar untuk transaksi ini.
              </p>
            )}
          </div>
        </div>
      ) : (
        /* ── Hasil Pencarian ── */
        <div className="space-y-2.5">
          {query.trim() !== '' && matches.length === 0 && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center">
              <p className="text-sm font-bold text-slate-700">Peserta tidak ditemukan</p>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                Coba nama lain atau pastikan no. HP benar. Anda juga bisa memindai QR di bawah.
              </p>
            </div>
          )}

          {matches.length > 0 && (
            <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-2.5">
              {matches.map((m) => (
                <button
                  key={m.tx.id}
                  onClick={() => onSelect(m)}
                  className="w-full flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-[#E70013]/40 shadow-xs text-left transition-all cursor-pointer active:scale-[0.99]"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#E70013] to-rose-400 text-white font-black flex items-center justify-center flex-shrink-0">
                    {initials(m.tx.customer_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 break-words">
                      {m.tx.customer_name || 'Tanpa Nama'}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">
                        {m.tx.customer_phone ? `${m.tx.customer_phone} · ` : ''}
                        {m.totalVouchers} kupon
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {m.pendingVouchers > 0 ? (
                      <span className="inline-flex px-2 py-1 rounded-full bg-[#E70013]/10 text-[#E70013] text-xs font-black">
                        {m.pendingVouchers} belum
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black">
                        Sudah ✓
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

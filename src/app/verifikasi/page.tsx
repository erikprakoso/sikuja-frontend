'use client';

import React, { useState, useEffect } from 'react';
import { claimStagePrize } from '@/lib/services/voucher';
import { getStoredDrawResults, getStoredVouchers, SIVOJA_EVENT_NAME } from '@/lib/storage';
import { DrawResult, Voucher } from '@/types';
import {
  CheckCircle2,
  AlertCircle,
  Trophy,
  ShieldCheck,
  Search,
  CheckSquare,
  QrCode,
  Flame,
} from 'lucide-react';

export default function VerifikasiPanggungPage() {
  const [code, setCode] = useState('');
  const [resultMsg, setResultMsg] = useState<{ success: boolean; message: string } | null>(null);
  const [drawResults, setDrawResults] = useState<DrawResult[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);

  const loadData = () => {
    setDrawResults(getStoredDrawResults());
    setVouchers(getStoredVouchers());
  };

  useEffect(() => {
    loadData();
    if (typeof window !== 'undefined') {
      window.addEventListener(SIVOJA_EVENT_NAME, loadData);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(SIVOJA_EVENT_NAME, loadData);
      }
    };
  }, []);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const res = claimStagePrize(code.trim());
    setResultMsg(res);
    if (res.success) {
      setCode('');
      loadData();
    }
  };

  const handleQuickClaim = (voucherCode: string) => {
    const res = claimStagePrize(voucherCode);
    setResultMsg(res);
    loadData();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verifikasi Klaim Panggung
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Validasi Kode Pemenang</h1>
          <p className="text-xs text-slate-400">
            Cocokkan voucher pemenang yang maju ke panggung dan tandai "diklaim" (pengganti sobek kertas).
          </p>
        </div>
      </div>

      {/* Verification Input Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <form onSubmit={handleVerify} className="space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            🔍 Input 5-Digit Kode Voucher Pemenang di Panggung:
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Contoh: 05678..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={5}
                className="w-full pl-10 pr-4 py-3.5 bg-slate-950 border border-slate-700 rounded-2xl text-white font-mono text-xl tracking-widest placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <Search className="absolute left-3.5 top-4 w-5 h-5 text-slate-400" />
            </div>

            <button
              type="submit"
              disabled={!code.trim()}
              className="px-8 py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2"
            >
              <CheckSquare className="w-5 h-5" />
              Tandai Diklaim
            </button>
          </div>
        </form>

        {resultMsg && (
          <div
            className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-3 animate-fade-in ${
              resultMsg.success
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
                : 'bg-red-950/80 border-red-800 text-red-200'
            }`}
          >
            {resultMsg.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <p>{resultMsg.message}</p>
          </div>
        )}
      </div>

      {/* Active Unclaimed Winners Table */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          Daftar Pemenang yang Belum Diklaim ({drawResults.filter((r) => !r.claimed).length})
        </h2>

        {drawResults.filter((r) => !r.claimed).length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
            Tidak ada pemenang yang menggantung (semua pemenang sudah diklaim / belum ada kocokan).
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {drawResults
              .filter((r) => !r.claimed)
              .map((res) => (
                <div
                  key={res.id}
                  className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-lg flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-amber-400">
                      Hadiah: {res.prize_name}
                    </span>
                    <p className="text-2xl font-black text-white font-mono tracking-widest">
                      {res.voucher_code}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Ditarik: {new Date(res.drawn_at).toLocaleTimeString('id-ID')}
                    </p>
                  </div>

                  <button
                    onClick={() => handleQuickClaim(res.voucher_code)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 flex-shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Klaim Hadiah
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

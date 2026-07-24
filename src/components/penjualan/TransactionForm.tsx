import React from 'react';
import { ShoppingBag, Minus, Plus, CheckCircle2 } from 'lucide-react';

interface TransactionFormProps {
  qtyFisik: number;
  qtyNonFisik: number;
  setQtyFisik: React.Dispatch<React.SetStateAction<number>>;
  setQtyNonFisik: React.Dispatch<React.SetStateAction<number>>;
  onSubmit: (e: React.FormEvent) => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  qtyFisik,
  qtyNonFisik,
  setQtyFisik,
  setQtyNonFisik,
  onSubmit,
}) => {
  const totalLembar = qtyFisik + qtyNonFisik;
  const totalHarga = totalLembar * 5000;

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left Input Section */}
      <div className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-red-500" />
          Pilih Jumlah & Tipe Voucher
        </h2>

        {/* Voucher Fisik Input */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                📜 Voucher Fisik (Dicetak/Tulis Kertas)
              </h3>
              <p className="text-[11px] text-slate-400">Kode 5-digit disalin ke kertas voucher</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">Rp5.000 / lbr</span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setQtyFisik(Math.max(0, qtyFisik - 1))}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-2xl font-black text-white font-mono px-4">{qtyFisik}</span>
            <button
              type="button"
              onClick={() => setQtyFisik(qtyFisik + 1)}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Voucher Non-Fisik Input */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
                📱 Voucher Non-Fisik (E-Voucher Digital)
              </h3>
              <p className="text-[11px] text-slate-400">Scan 1 QR transaksi via HP pembeli</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">Rp5.000 / lbr</span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setQtyNonFisik(Math.max(0, qtyNonFisik - 1))}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-2xl font-black text-cyan-300 font-mono px-4">{qtyNonFisik}</span>
            <button
              type="button"
              onClick={() => setQtyNonFisik(qtyNonFisik + 1)}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Batch Presets */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-slate-400 font-semibold">Preset Cepat:</span>
          {[2, 5, 10, 20].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => {
                setQtyFisik(num);
                setQtyNonFisik(0);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              {num} Fisik
            </button>
          ))}
        </div>
      </div>

      {/* Right Summary & Action Box */}
      <div className="space-y-6 bg-gradient-to-br from-red-950/80 via-slate-900 to-slate-950 border border-red-900/60 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between">
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-white">Ringkasan Pembayaran</h2>

          <div className="space-y-2 border-y border-slate-800 py-4 text-sm">
            <div className="flex justify-between text-slate-300">
              <span>Jumlah Voucher Fisik:</span>
              <span className="font-bold text-white">{qtyFisik} lembar</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Jumlah E-Voucher Digital:</span>
              <span className="font-bold text-cyan-300">{qtyNonFisik} lembar</span>
            </div>
            <div className="flex justify-between text-slate-300 pt-2 border-t border-slate-800/60">
              <span className="font-bold text-white">Total Kuantitas:</span>
              <span className="font-black text-red-400">{totalLembar} lembar</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-red-900/40 text-center space-y-1">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Total Tagihan Tunai
            </span>
            <p className="text-3xl font-black text-amber-400 font-mono">
              Rp {totalHarga.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={totalLembar <= 0}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white font-black text-lg shadow-xl shadow-red-950/80 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          Proses & Terbitkan Kode
        </button>
      </div>
    </form>
  );
};

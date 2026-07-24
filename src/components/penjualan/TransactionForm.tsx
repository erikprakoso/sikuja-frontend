import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { ShoppingBag, Minus, Plus, CheckCircle2, Banknote, QrCode, Loader2 } from 'lucide-react';
import { generateDynamicQris, getSavedStaticQris } from '@/lib/services/qris';

interface TransactionFormProps {
  qtyFisik: number;
  qtyNonFisik: number;
  paymentMethod: 'cash' | 'qris';
  isLoading?: boolean;
  setQtyFisik: React.Dispatch<React.SetStateAction<number>>;
  setQtyNonFisik: React.Dispatch<React.SetStateAction<number>>;
  setPaymentMethod: (method: 'cash' | 'qris') => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  qtyFisik,
  qtyNonFisik,
  paymentMethod,
  isLoading = false,
  setQtyFisik,
  setQtyNonFisik,
  setPaymentMethod,
  onSubmit,
}) => {
  const totalLembar = qtyFisik + qtyNonFisik;
  const totalHarga = totalLembar * 5000;
  const [qrisDataUrl, setQrisDataUrl] = useState<string>('');

  // Active voucher type: default to non_fisik if qtyNonFisik > 0 and qtyFisik === 0, else fisik
  const activeType: 'fisik' | 'non_fisik' = qtyNonFisik > 0 && qtyFisik === 0 ? 'non_fisik' : 'fisik';
  const currentQty = activeType === 'fisik' ? qtyFisik : qtyNonFisik;

  const handleTypeChange = (type: 'fisik' | 'non_fisik') => {
    const qtyToTransfer = currentQty > 0 ? currentQty : 1;
    if (type === 'fisik') {
      setQtyFisik(qtyToTransfer);
      setQtyNonFisik(0);
    } else {
      setQtyNonFisik(qtyToTransfer);
      setQtyFisik(0);
    }
  };

  const handleQtyChange = (newQty: number) => {
    const safeQty = Math.max(1, newQty);
    if (activeType === 'fisik') {
      setQtyFisik(safeQty);
      setQtyNonFisik(0);
    } else {
      setQtyNonFisik(safeQty);
      setQtyFisik(0);
    }
  };

  // Generate QRIS string dynamic or default static QRIS
  useEffect(() => {
    if (paymentMethod === 'qris') {
      const baseQris = getSavedStaticQris();
      const payload = totalHarga > 0 ? generateDynamicQris(baseQris, totalHarga) : baseQris;
      QRCode.toDataURL(payload, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
        .then((url) => setQrisDataUrl(url))
        .catch((err) => console.error('QRIS Gen error:', err));
    }
  }, [paymentMethod, totalHarga]);

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Input Options */}
      <div className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <h2 className="text-lg font-extrabold text-white">1. Pilih Kupon</h2>

        {/* 1. Select Voucher Type */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">Jenis Voucher:</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange('fisik')}
              disabled={isLoading}
              className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                activeType === 'fisik'
                  ? 'bg-red-950/80 border-red-500 text-white ring-2 ring-red-500/40 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">📜</span>
                {activeType === 'fisik' && <span className="text-[10px] font-bold text-red-400 uppercase">Dipilih</span>}
              </div>
              <span className="text-sm font-bold mt-1">Voucher Fisik</span>
              <span className="text-[10px] text-slate-400">Kupon cetak / fisik</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('non_fisik')}
              disabled={isLoading}
              className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                activeType === 'non_fisik'
                  ? 'bg-cyan-950/80 border-cyan-500 text-white ring-2 ring-cyan-400/40 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">📱</span>
                {activeType === 'non_fisik' && <span className="text-[10px] font-bold text-cyan-400 uppercase">Dipilih</span>}
              </div>
              <span className="text-sm font-bold mt-1">E-Voucher Digital</span>
              <span className="text-[10px] text-slate-400">Kupon digital E-Voucher</span>
            </button>
          </div>
        </div>

        {/* 2. Quantity Counter with Embedded Quick Presets */}
        <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">
                Jumlah {activeType === 'fisik' ? 'Voucher Fisik' : 'E-Voucher Digital'}
              </h3>
              <p className="text-[11px] text-slate-400">Harga: Rp5.000 / lembar</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">
              Rp {(currentQty * 5000).toLocaleString('id-ID')}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => handleQtyChange(currentQty - 1)}
              disabled={isLoading}
              className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center transition-all cursor-pointer active:scale-95"
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className={`text-3xl font-black font-mono px-4 ${activeType === 'fisik' ? 'text-white' : 'text-cyan-300'}`}>
              {currentQty}
            </span>
            <button
              type="button"
              onClick={() => handleQtyChange(currentQty + 1)}
              disabled={isLoading}
              className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Batch Presets */}
          <div className="flex items-center gap-1.5 pt-3 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Jumlah Cepat:</span>
            {[1, 2, 5, 10, 20].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleQtyChange(num)}
                disabled={isLoading}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  currentQty === num
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Payment & Action Box */}
      <div className="space-y-6 bg-gradient-to-br from-red-950/80 via-slate-900 to-slate-950 border border-red-900/60 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between">
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-white">2. Metode Pembayaran</h2>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              disabled={isLoading}
              className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                paymentMethod === 'cash'
                  ? 'bg-emerald-950/80 border-emerald-500 text-white ring-2 ring-emerald-400/40 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <Banknote className={`w-5 h-5 ${paymentMethod === 'cash' ? 'text-emerald-400' : 'text-slate-400'}`} />
                {paymentMethod === 'cash' && <span className="text-[10px] font-bold text-emerald-400 uppercase">Dipilih</span>}
              </div>
              <span className="text-sm font-bold mt-1">Tunai / Cash</span>
              <span className="text-[10px] text-slate-400">Pembayaran uang tunai</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('qris')}
              disabled={isLoading}
              className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                paymentMethod === 'qris'
                  ? 'bg-cyan-950/80 border-cyan-500 text-white ring-2 ring-cyan-400/40 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <QrCode className={`w-5 h-5 ${paymentMethod === 'qris' ? 'text-cyan-400' : 'text-slate-400'}`} />
                {paymentMethod === 'qris' && <span className="text-[10px] font-bold text-cyan-400 uppercase">Dipilih</span>}
              </div>
              <span className="text-sm font-bold mt-1">QRIS Digital</span>
              <span className="text-[10px] text-slate-400">Pembayaran via QRIS</span>
            </button>
          </div>

          {/* QRIS Code Display */}
          {paymentMethod === 'qris' && (
            <div className="p-4 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 text-center space-y-3 animate-fade-in shadow-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-900/60 border border-cyan-600/60 text-cyan-200 text-xs font-bold uppercase tracking-wider">
                <QrCode className="w-3.5 h-3.5 text-cyan-300" />
                QRIS Pembayaran
              </div>

              {qrisDataUrl ? (
                <div className="py-1">
                  <div className="p-3 bg-white rounded-2xl inline-block border-4 border-cyan-400 shadow-2xl">
                    <img src={qrisDataUrl} alt="Kode QRIS Pembayaran" className="w-48 h-48 sm:w-52 sm:h-52 object-contain" />
                  </div>
                  <p className="text-xs font-bold text-white mt-2">
                    Total Tagihan: <span className="text-amber-400 font-mono text-base">Rp {totalHarga.toLocaleString('id-ID')}</span>
                  </p>
                  <p className="text-[10px] text-cyan-200/90 mt-0.5">
                    Silakan pembeli melakukan pemindaian QRIS melalui m-Banking atau E-Wallet.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Memuat Kode QRIS...</p>
              )}
            </div>
          )}

          {/* Summary Box */}
          <div className="space-y-2 border-y border-slate-800 py-3 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Jenis & Jumlah Voucher:</span>
              <span className="font-bold text-white">
                {activeType === 'fisik' ? `Voucher Fisik (${qtyFisik} Lembar)` : `E-Voucher Digital (${qtyNonFisik} Lembar)`}
              </span>
            </div>
            <div className="flex justify-between text-slate-300 pt-2 border-t border-slate-800/60 font-bold">
              <span>Metode Pembayaran:</span>
              <span className={paymentMethod === 'cash' ? 'text-emerald-400 uppercase' : 'text-cyan-400 uppercase'}>
                {paymentMethod === 'cash' ? 'Tunai / Cash' : 'QRIS Digital'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-red-900/40 text-center space-y-1">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Total Pembayaran
            </span>
            <p className="text-3xl font-black text-amber-400 font-mono">
              Rp {totalHarga.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={totalLembar <= 0 || isLoading}
          className={`w-full py-3.5 px-6 rounded-2xl font-extrabold text-base shadow-lg hover:scale-[1.01] active:scale-[0.98] cursor-pointer transition-all flex items-center justify-center gap-2 ${
            paymentMethod === 'cash'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950/60'
          } disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none`}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-white flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          )}
          <span>
            {isLoading
              ? 'Memproses Transaksi...'
              : paymentMethod === 'cash'
              ? 'Proses Pembayaran Tunai'
              : 'Proses Pembayaran QRIS'}
          </span>
        </button>
      </div>
    </form>
  );
};

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { ShoppingBag, Minus, Plus, CheckCircle2, Banknote, QrCode, Loader2, Dices, Hash, AlertCircle, CheckCircle } from 'lucide-react';
import { generateDynamicQris, getSavedStaticQris } from '@/lib/services/qris';
import { checkCodeAvailable, format5DigitCode } from '@/lib/services/voucher';

interface TransactionFormProps {
  qtyFisik: number;
  qtyNonFisik: number;
  paymentMethod: 'cash' | 'qris';
  isLoading?: boolean;
  setQtyFisik: React.Dispatch<React.SetStateAction<number>>;
  setQtyNonFisik: React.Dispatch<React.SetStateAction<number>>;
  setPaymentMethod: (method: 'cash' | 'qris') => void;
  onSubmit: (e: React.FormEvent, customCodes?: string[]) => void;
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

  // Mode Alokasi Kode: 'auto' (random acak) atau 'custom' (pilih nomor hoki)
  const [codeMode, setCodeMode] = useState<'auto' | 'custom'>('auto');
  const [customCodes, setCustomCodes] = useState<string[]>([]);
  const [customCodeStatuses, setCustomCodeStatuses] = useState<{ [key: number]: { available: boolean; formatted: string } }>({});

  const activeType: 'fisik' | 'non_fisik' = qtyNonFisik > 0 && qtyFisik === 0 ? 'non_fisik' : 'fisik';
  const currentQty = activeType === 'fisik' ? qtyFisik : qtyNonFisik;

  useEffect(() => {
    setCustomCodes((prev) => {
      const next = [...prev];
      if (next.length < totalLembar) {
        while (next.length < totalLembar) next.push('');
      } else if (next.length > totalLembar) {
        next.length = totalLembar;
      }
      return next;
    });
  }, [totalLembar]);

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

  const handleCustomCodeInputChange = (index: number, val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 5);
    const updated = [...customCodes];
    updated[index] = digitsOnly;
    setCustomCodes(updated);

    if (digitsOnly.length > 0) {
      const status = checkCodeAvailable(digitsOnly);
      setCustomCodeStatuses((prev) => ({
        ...prev,
        [index]: { available: status.available, formatted: status.formattedCode },
      }));
    } else {
      setCustomCodeStatuses((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  useEffect(() => {
    if (paymentMethod === 'qris') {
      const baseQris = getSavedStaticQris();
      const payload = totalHarga > 0 ? generateDynamicQris(baseQris, totalHarga) : baseQris;
      QRCode.toDataURL(payload, { width: 300, margin: 2, color: { dark: '#E70013', light: '#ffffff' } })
        .then((url) => setQrisDataUrl(url))
        .catch((err) => console.error('QRIS Gen error:', err));
    }
  }, [paymentMethod, totalHarga]);

  const hasCustomCodeError = Object.values(customCodeStatuses).some((s) => s.formatted && !s.available);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const activeCustomCodes = codeMode === 'custom' ? customCodes.filter((c) => c.trim() !== '') : [];
    onSubmit(e, activeCustomCodes);
  };

  return (
    <form onSubmit={handleSubmitForm} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Input Options */}
      <div className="space-y-6 bg-white border-4 border-[#E70013] rounded-3xl p-6 sm:p-8 shadow-xl">
        <h2 className="text-lg font-black text-[#E70013]">1. Pilih Kupon</h2>

        {/* 1. Select Voucher Type */}
        <div className="space-y-2">
          <label className="text-xs font-black text-[#E70013]">Jenis Voucher:</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange('fisik')}
              disabled={isLoading}
              className={`p-3.5 rounded-2xl border-2 text-left flex flex-col gap-1 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                activeType === 'fisik'
                  ? 'bg-[#E70013] border-[#E70013] text-white shadow-lg font-black'
                  : 'bg-white border-[#E70013] text-[#E70013] hover:bg-[#E70013]/10 font-bold'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">📜</span>
                {activeType === 'fisik' && <span className="text-[10px] font-black uppercase text-white bg-white/20 px-2 py-0.5 rounded">Dipilih</span>}
              </div>
              <span className="text-sm font-black mt-1">Voucher Fisik</span>
              <span className="text-[10px] opacity-90">Kupon cetak / fisik</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('non_fisik')}
              disabled={isLoading}
              className={`p-3.5 rounded-2xl border-2 text-left flex flex-col gap-1 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                activeType === 'non_fisik'
                  ? 'bg-[#E70013] border-[#E70013] text-white shadow-lg font-black'
                  : 'bg-white border-[#E70013] text-[#E70013] hover:bg-[#E70013]/10 font-bold'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">📱</span>
                {activeType === 'non_fisik' && <span className="text-[10px] font-black uppercase text-white bg-white/20 px-2 py-0.5 rounded">Dipilih</span>}
              </div>
              <span className="text-sm font-black mt-1">E-Voucher Digital</span>
              <span className="text-[10px] opacity-90">Kupon digital E-Voucher</span>
            </button>
          </div>
        </div>

        {/* 2. Quantity Counter */}
        <div className="p-5 rounded-2xl bg-white border-2 border-[#E70013] space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-[#E70013]">
                Jumlah {activeType === 'fisik' ? 'Voucher Fisik' : 'E-Voucher Digital'}
              </h3>
              <p className="text-[11px] font-bold text-[#E70013]">Harga: Rp5.000 / lembar</p>
            </div>
            <span className="text-sm font-mono font-black text-[#E70013]">
              Rp {(currentQty * 5000).toLocaleString('id-ID')}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => handleQtyChange(currentQty - 1)}
              disabled={isLoading}
              className="w-12 h-12 rounded-2xl bg-[#E70013] text-white font-black flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="text-3xl font-black font-mono px-4 text-[#E70013]">
              {currentQty}
            </span>
            <button
              type="button"
              onClick={() => handleQtyChange(currentQty + 1)}
              disabled={isLoading}
              className="w-12 h-12 rounded-2xl bg-[#E70013] text-white font-black flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Batch Presets */}
          <div className="flex items-center gap-1.5 pt-3 border-t-2 border-[#E70013]">
            <span className="text-[11px] text-[#E70013] font-black mr-1">Jumlah Cepat:</span>
            {[1, 2, 5, 10, 20].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleQtyChange(num)}
                disabled={isLoading}
                className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all text-center cursor-pointer active:scale-95 disabled:opacity-50 ${
                  currentQty === num
                    ? 'bg-[#E70013] text-white shadow-md'
                    : 'bg-white text-[#E70013] border-2 border-[#E70013] hover:bg-[#E70013] hover:text-white'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Mode Penentuan Kode */}
        <div className="space-y-3 p-4 rounded-2xl bg-white border-2 border-[#E70013]">
          <label className="text-xs font-black text-[#E70013] block">Penentuan Kode 5-Digit:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCodeMode('auto')}
              disabled={isLoading}
              className={`py-2.5 px-3 rounded-xl border-2 text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                codeMode === 'auto'
                  ? 'bg-[#E70013] border-[#E70013] text-white shadow-md'
                  : 'bg-white border-[#E70013] text-[#E70013]'
              }`}
            >
              <Dices className="w-4 h-4" />
              <span>Kode Acak (Default)</span>
            </button>

            <button
              type="button"
              onClick={() => setCodeMode('custom')}
              disabled={isLoading}
              className={`py-2.5 px-3 rounded-xl border-2 text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                codeMode === 'custom'
                  ? 'bg-[#E70013] border-[#E70013] text-white shadow-md'
                  : 'bg-white border-[#E70013] text-[#E70013]'
              }`}
            >
              <Hash className="w-4 h-4" />
              <span>Pilih Nomor Hoki</span>
            </button>
          </div>

          {/* Custom Codes Inputs Grid */}
          {codeMode === 'custom' && (
            <div className="pt-2 space-y-2">
              <p className="text-[11px] text-[#E70013] font-bold leading-tight">
                Ketik nomor pilihan pembeli (misal `77` -&gt; `00077`). Jika ada slot kosong, otomatis diisi kode acak.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {customCodes.map((val, idx) => {
                  const status = customCodeStatuses[idx];
                  const isAvailable = status?.available;
                  const isFilled = val.length > 0;

                  return (
                    <div key={idx} className="relative flex items-center">
                      <span className="absolute left-3 text-[10px] font-mono font-bold text-[#E70013]">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="Nomor Hoki"
                        value={val}
                        onChange={(e) => handleCustomCodeInputChange(idx, e.target.value)}
                        disabled={isLoading}
                        className={`w-full pl-9 pr-8 py-2 bg-white border-2 rounded-xl font-mono text-xs text-[#E70013] font-black focus:outline-none transition-all ${
                          isFilled
                            ? isAvailable
                              ? 'border-[#E70013] bg-white'
                              : 'border-[#E70013] bg-[#E70013] text-white'
                            : 'border-[#E70013]'
                        }`}
                      />
                      {isFilled && (
                        <div className="absolute right-2.5">
                          {isAvailable ? (
                            <span title="🟢 Kode Tersedia">
                              <CheckCircle className="w-4 h-4 text-[#E70013]" />
                            </span>
                          ) : (
                            <span title="🔴 Kode Sudah Terbit">
                              <AlertCircle className="w-4 h-4 text-white" />
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {hasCustomCodeError && (
                <p className="text-[11px] text-white bg-[#E70013] p-2 rounded-lg font-black flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  Beberapa kode pilihan sudah pernah terbit/milik orang lain. Ganti dengan angka lain.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Payment & Action Box */}
      <div className="space-y-6 bg-white border-4 border-[#E70013] rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between">
        <div className="space-y-4">
          <h2 className="text-lg font-black text-[#E70013]">2. Metode Pembayaran</h2>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              disabled={isLoading}
              className={`p-3.5 rounded-2xl border-2 text-left flex flex-col gap-1 transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                paymentMethod === 'cash'
                  ? 'bg-[#E70013] border-[#E70013] text-white shadow-lg font-black'
                  : 'bg-white border-[#E70013] text-[#E70013] font-bold'
              }`}
            >
              <div className="flex items-center justify-between">
                <Banknote className="w-5 h-5" />
                {paymentMethod === 'cash' && <span className="text-[10px] font-black uppercase text-white bg-white/20 px-2 py-0.5 rounded">Dipilih</span>}
              </div>
              <span className="text-sm font-black mt-1">Tunai / Cash</span>
              <span className="text-[10px] opacity-90">Pembayaran uang tunai</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('qris')}
              disabled={isLoading}
              className={`p-3.5 rounded-2xl border-2 text-left flex flex-col gap-1 transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                paymentMethod === 'qris'
                  ? 'bg-[#E70013] border-[#E70013] text-white shadow-lg font-black'
                  : 'bg-white border-[#E70013] text-[#E70013] font-bold'
              }`}
            >
              <div className="flex items-center justify-between">
                <QrCode className="w-5 h-5" />
                {paymentMethod === 'qris' && <span className="text-[10px] font-black uppercase text-white bg-white/20 px-2 py-0.5 rounded">Dipilih</span>}
              </div>
              <span className="text-sm font-black mt-1">QRIS Digital</span>
              <span className="text-[10px] opacity-90">Pembayaran via QRIS</span>
            </button>
          </div>

          {/* QRIS Code Display */}
          {paymentMethod === 'qris' && (
            <div className="p-4 rounded-2xl bg-white border-2 border-[#E70013] text-center space-y-3 shadow-md">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E70013] text-white text-xs font-black uppercase tracking-wider">
                <QrCode className="w-3.5 h-3.5 text-white" />
                QRIS Pembayaran
              </div>

              {qrisDataUrl ? (
                <div className="py-1">
                  <div className="p-3 bg-white rounded-2xl inline-block border-4 border-[#E70013] shadow-lg">
                    <img src={qrisDataUrl} alt="Kode QRIS Pembayaran" className="w-48 h-48 sm:w-52 sm:h-52 object-contain" />
                  </div>
                  <p className="text-xs font-black text-[#E70013] mt-2">
                    Total Tagihan: <span className="text-[#E70013] font-mono text-base font-black">Rp {totalHarga.toLocaleString('id-ID')}</span>
                  </p>
                  <p className="text-[10px] text-[#E70013] font-bold mt-0.5">
                    Silakan pembeli melakukan pemindaian QRIS melalui m-Banking atau E-Wallet.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[#E70013] font-bold">Memuat Kode QRIS...</p>
              )}
            </div>
          )}

          {/* Summary Box */}
          <div className="space-y-2 border-y-2 border-[#E70013] py-3 text-xs font-black text-[#E70013]">
            <div className="flex justify-between">
              <span>Jenis & Jumlah Voucher:</span>
              <span>
                {activeType === 'fisik' ? `Voucher Fisik (${qtyFisik} Lembar)` : `E-Voucher Digital (${qtyNonFisik} Lembar)`}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span>Mode Kode:</span>
              <span className="uppercase">
                {codeMode === 'auto' ? 'Acak Otomatis' : 'Pilih Nomor Hoki'}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-[#E70013] font-black uppercase">
              <span>Metode Pembayaran:</span>
              <span>
                {paymentMethod === 'cash' ? 'Tunai / Cash' : 'QRIS Digital'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#E70013] text-white text-center space-y-1 shadow-md">
            <span className="text-xs uppercase font-black tracking-wider">
              Total Pembayaran
            </span>
            <p className="text-3xl font-black font-mono">
              Rp {totalHarga.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={totalLembar <= 0 || isLoading || hasCustomCodeError}
          className="w-full py-3.5 px-6 rounded-2xl font-black text-base shadow-lg bg-[#E70013] hover:bg-[#E70013]/90 text-white cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2 border-2 border-[#E70013] disabled:opacity-50 disabled:cursor-not-allowed"
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

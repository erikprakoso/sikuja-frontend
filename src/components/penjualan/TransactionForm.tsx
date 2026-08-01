import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Minus, Plus, CheckCircle2, Banknote, QrCode, Loader2, Dices, Hash, AlertCircle, CheckCircle } from 'lucide-react';
import { generateDynamicQris, getSavedStaticQris } from '@/lib/services/qris';
import { checkCodeAvailable } from '@/lib/services/voucher';

interface TransactionFormProps {
  qtyFisik: number;
  qtyNonFisik: number;
  paymentMethod: 'cash' | 'qris';
  isLoading?: boolean;
  conflictCode?: string;
  onClearConflict?: () => void;
  setQtyFisik: React.Dispatch<React.SetStateAction<number>>;
  setQtyNonFisik: React.Dispatch<React.SetStateAction<number>>;
  setPaymentMethod: (method: 'cash' | 'qris') => void;
  onSubmit: (e: React.FormEvent, customCodes?: string[], customerName?: string, customerPhone?: string) => void;
}

const MAX_VOUCHERS_PER_SALE = 200;

export const TransactionForm: React.FC<TransactionFormProps> = ({
  qtyFisik,
  qtyNonFisik,
  paymentMethod,
  isLoading = false,
  conflictCode = '',
  onClearConflict = () => {},
  setQtyFisik,
  setQtyNonFisik,
  setPaymentMethod,
  onSubmit,
}) => {
  const totalLembar = qtyFisik + qtyNonFisik;
  const totalHarga = totalLembar * 5000;
  const [qrisDataUrl, setQrisDataUrl] = useState<string>('');

  const [codeMode, setCodeMode] = useState<'auto' | 'custom'>('auto');
  const [customCodes, setCustomCodes] = useState<string[]>([]);
  const [customCodeStatuses, setCustomCodeStatuses] = useState<{ [key: number]: { available: boolean; formatted: string } }>({});
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  const activeType: 'fisik' | 'non_fisik' = qtyNonFisik > 0 && qtyFisik === 0 ? 'non_fisik' : 'fisik';
  const currentQty = activeType === 'fisik' ? qtyFisik : qtyNonFisik;

  // Derive, bukan setState di dalam effect (mengikuti aturan react-hooks):
  // - activeCodeMode: saat server menolak nomor hoki, paksa tampil mode custom.
  // - qrisPayload/qrisNotConfigured: QRIS kosong berarti belum dikonfigurasi.
  const activeCodeMode: 'auto' | 'custom' = conflictCode ? 'custom' : codeMode;
  const qrisBase = getSavedStaticQris();
  const qrisPayload = totalHarga > 0 ? generateDynamicQris(qrisBase, totalHarga) : qrisBase;
  const qrisNotConfigured = paymentMethod === 'qris' && !qrisPayload;

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
    const safeQty = Math.min(MAX_VOUCHERS_PER_SALE, Math.max(1, newQty));
    if (activeType === 'fisik') {
      setQtyFisik(safeQty);
      setQtyNonFisik(0);
    } else {
      setQtyNonFisik(safeQty);
      setQtyFisik(0);
    }
  };

  const handleCustomCodeInputChange = (index: number, val: string) => {
    // Setelah server menolak kode tertentu, begitu slot tersebut diubah konflik selesai.
    if (conflictCode && customCodes[index] === conflictCode) {
      onClearConflict();
    }

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
    if (paymentMethod === 'qris' && qrisPayload) {
      QRCode.toDataURL(qrisPayload, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
        .then((url) => setQrisDataUrl(url))
        .catch((err) => console.error('QRIS Gen error:', err));
    }
  }, [paymentMethod, totalHarga, qrisPayload]);

  const hasCustomCodeError = Object.values(customCodeStatuses).some((s) => s.formatted && !s.available);
  const hasServerConflict = conflictCode !== '';

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const activeCustomCodes = activeCodeMode === 'custom' ? customCodes.filter((c) => c.trim() !== '') : [];
    onSubmit(e, activeCustomCodes, customerName, customerPhone);
  };

  return (
    <form onSubmit={handleSubmitForm} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Input Options */}
      <div className="space-y-6 bg-white border border-[#E70013]/20 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-black text-slate-900">1. Pilih Jenis & Jumlah Voucher</h2>

        {/* 1. Select Voucher Type */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600">Jenis Voucher:</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange('fisik')}
              disabled={isLoading}
              className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed ${
                activeType === 'fisik'
                  ? 'bg-[#E70013] border-[#E70013] text-white shadow-md font-bold'
                  : 'bg-white border-slate-200 text-slate-800 hover:border-[#E70013]/40 font-medium'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">📜</span>
                {activeType === 'fisik' && <span className="text-[10px] font-bold uppercase text-white bg-white/20 px-2 py-0.5 rounded-full">Dipilih</span>}
              </div>
              <span className="text-sm font-black mt-1">Voucher Fisik</span>
              <span className="text-[11px] opacity-80">Kupon cetak langsung</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('non_fisik')}
              disabled={isLoading}
              className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed ${
                activeType === 'non_fisik'
                  ? 'bg-[#E70013] border-[#E70013] text-white shadow-md font-bold'
                  : 'bg-white border-slate-200 text-slate-800 hover:border-[#E70013]/40 font-medium'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">📱</span>
                {activeType === 'non_fisik' && <span className="text-[10px] font-bold uppercase text-white bg-white/20 px-2 py-0.5 rounded-full">Dipilih</span>}
              </div>
              <span className="text-sm font-black mt-1">E-Voucher Digital</span>
              <span className="text-[11px] opacity-80">Kupon tautan digital</span>
            </button>
          </div>
        </div>

        {/* 2. Quantity Counter */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Jumlah {activeType === 'fisik' ? 'Voucher Fisik' : 'E-Voucher Digital'}
              </h3>
              <p className="text-[11px] font-semibold text-slate-500">Harga: Rp5.000 / lembar</p>
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
              className="w-11 h-11 rounded-xl bg-[#E70013] text-white font-bold flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-3xl font-black font-mono px-4 text-slate-900">
              {currentQty}
            </span>
            <button
              type="button"
              onClick={() => handleQtyChange(currentQty + 1)}
              disabled={isLoading || currentQty >= MAX_VOUCHERS_PER_SALE}
              className="w-11 h-11 rounded-xl bg-[#E70013] text-white font-bold flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {currentQty >= MAX_VOUCHERS_PER_SALE && (
            <p className="text-[11px] text-[#E70013] font-bold bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              Maksimal {MAX_VOUCHERS_PER_SALE} voucher per transaksi.
            </p>
          )}

          {/* Quick Batch Presets */}
          <div className="flex items-center gap-1.5 pt-3 border-t border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold mr-1">Preset:</span>
            {[1, 2, 5, 10, 20].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleQtyChange(num)}
                disabled={isLoading}
                className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all text-center cursor-pointer active:scale-95 disabled:opacity-50 ${
                  currentQty === num
                    ? 'bg-[#E70013] text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-[#E70013]'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Mode Penentuan Kode */}
        <div className="space-y-3 p-5 rounded-2xl border border-slate-200 bg-white">
          <label className="text-xs font-bold text-slate-900 block">2. Penentuan Kode 5-Digit:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setCodeMode('auto');
                onClearConflict();
              }}
              disabled={isLoading}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                activeCodeMode === 'auto'
                  ? 'bg-[#E70013] border-[#E70013] text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-[#E70013]/40'
              }`}
            >
              <Dices className="w-4 h-4" />
              <span>Kode Acak</span>
            </button>

            <button
              type="button"
              onClick={() => setCodeMode('custom')}
              disabled={isLoading}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                activeCodeMode === 'custom'
                  ? 'bg-[#E70013] border-[#E70013] text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-[#E70013]/40'
              }`}
            >
              <Hash className="w-4 h-4" />
              <span>Pilih Nomor Hoki</span>
            </button>
          </div>

          {/* Custom Codes Inputs Grid */}
          {activeCodeMode === 'custom' && (
            <div className="pt-2 space-y-2">
              <p className="text-[11px] text-slate-500 font-medium leading-tight">
                Ketik nomor pilihan pembeli (misal `77` -&gt; `00077`). Jika slot kosong, otomatis diisi acak.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {customCodes.map((val, idx) => {
                  const status = customCodeStatuses[idx];
                  const isConflictSlot = conflictCode !== '' && val === conflictCode;
                  const isAvailable = status?.available && !isConflictSlot;
                  const isFilled = val.length > 0;

                  return (
                    <div key={idx} className="relative flex items-center">
                      <span className="absolute left-3 text-[10px] font-mono font-bold text-slate-400">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="Nomor Hoki"
                        value={val}
                        onChange={(e) => handleCustomCodeInputChange(idx, e.target.value)}
                        disabled={isLoading}
                        className={`w-full pl-9 pr-8 py-2 bg-white border rounded-xl font-mono text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#E70013]/20 transition-all ${
                          isFilled
                            ? isAvailable
                              ? 'border-[#E70013] bg-white'
                              : 'border-[#E70013] bg-[#E70013] text-white'
                            : 'border-slate-200'
                        }`}
                      />
                      {isFilled && (
                        <div className="absolute right-2.5">
                          {isConflictSlot ? (
                            <span title="🔴 Ditolak server (sudah terbit oleh kasir lain)">
                              <AlertCircle className="w-4 h-4 text-white animate-pulse" />
                            </span>
                          ) : isAvailable ? (
                            <span title="🟢 Kode Tersedia">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
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
              {conflictCode && (
                <p className="text-[11px] text-white bg-[#E70013] p-2.5 rounded-xl font-bold flex items-center gap-1.5 mt-1 animate-fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Kode {conflictCode} ditolak server karena sudah terbit oleh kasir lain. Silakan ganti dengan angka lain.
                </p>
              )}
              {hasCustomCodeError && !conflictCode && (
                <p className="text-[11px] text-white bg-[#E70013] p-2.5 rounded-xl font-bold flex items-center gap-1.5 mt-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Beberapa nomor hoki sudah pernah terbit/terpakai. Mohon ganti dengan angka lain.
                </p>
              )}
            </div>
          )}
        </div>

        {/* 3. Identitas Pemilik Kupon (Opsional) */}
        <div className="space-y-3 p-5 rounded-2xl border border-slate-200 bg-white">
          <label className="text-xs font-bold text-slate-900 block">
            3. Identitas Pemilik Kupon (Opsional):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 font-semibold mb-1 block">Nama Pembeli / Pemilik:</label>
              <input
                type="text"
                placeholder="Contoh: Pak Budi / Bu Ani"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={isLoading}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E70013]/20"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold mb-1 block">No. WhatsApp / HP:</label>
              <input
                type="text"
                placeholder="Contoh: 08123456789"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                disabled={isLoading}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E70013]/20"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">
            🔒 Identitas ini memudahkan pencarian E-Voucher jika pembeli lupa token transaksi.
          </p>
        </div>
      </div>

      {/* Right Payment & Action Box */}
      <div className="space-y-6 bg-white border border-[#E70013]/20 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-900">4. Metode Pembayaran</h2>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              disabled={isLoading}
              className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer active:scale-98 disabled:opacity-50 ${
                paymentMethod === 'cash'
                  ? 'bg-[#E70013] border-[#E70013] text-white shadow-md font-bold'
                  : 'bg-white border-slate-200 text-slate-800 hover:border-[#E70013]/40 font-medium'
              }`}
            >
              <div className="flex items-center justify-between">
                <Banknote className="w-5 h-5" />
                {paymentMethod === 'cash' && <span className="text-[10px] font-bold uppercase text-white bg-white/20 px-2 py-0.5 rounded-full">Dipilih</span>}
              </div>
              <span className="text-sm font-black mt-1">Tunai / Cash</span>
              <span className="text-[11px] opacity-80">Pembayaran tunai</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('qris')}
              disabled={isLoading}
              className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer active:scale-98 disabled:opacity-50 ${
                paymentMethod === 'qris'
                  ? 'bg-[#E70013] border-[#E70013] text-white shadow-md font-bold'
                  : 'bg-white border-slate-200 text-slate-800 hover:border-[#E70013]/40 font-medium'
              }`}
            >
              <div className="flex items-center justify-between">
                <QrCode className="w-5 h-5" />
                {paymentMethod === 'qris' && <span className="text-[10px] font-bold uppercase text-white bg-white/20 px-2 py-0.5 rounded-full">Dipilih</span>}
              </div>
              <span className="text-sm font-black mt-1">QRIS Digital</span>
              <span className="text-[11px] opacity-80">Scan via QRIS</span>
            </button>
          </div>

          {/* QRIS Code Display */}
          {paymentMethod === 'qris' && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3 shadow-xs">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                <QrCode className="w-3.5 h-3.5 text-white" />
                QRIS Pembayaran Standar
              </div>

              {qrisNotConfigured ? (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-start gap-2 text-left animate-fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    QRIS belum dikonfigurasi panitia, sehingga kode QR tidak dapat dibuat. Silakan pilih metode{' '}
                    <span className="font-black">Tunai / Cash</span> atau hubungi panitia terlebih dahulu.
                  </span>
                </div>
              ) : qrisDataUrl ? (
                <div className="py-1">
                  <div className="p-3 bg-white rounded-2xl inline-block border border-slate-200 shadow-md">
                    <img src={qrisDataUrl} alt="Kode QRIS Pembayaran" className="w-48 h-48 sm:w-52 sm:h-52 object-contain" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 mt-2">
                    Total Tagihan: <span className="text-[#E70013] font-mono text-base font-black">Rp {totalHarga.toLocaleString('id-ID')}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Silakan lakukan pemindaian QRIS melalui m-Banking / E-Wallet.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-medium">Memuat Kode QRIS...</p>
              )}
            </div>
          )}

          {/* Summary Box */}
          <div className="space-y-2 border-y border-slate-200 py-3 text-xs font-semibold text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Jumlah Voucher:</span>
              <span className="font-bold text-slate-900">
                {activeType === 'fisik' ? `Voucher Fisik (${qtyFisik} Lembar)` : `E-Voucher Digital (${qtyNonFisik} Lembar)`}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-500">Mode Kode:</span>
              <span className="font-bold text-slate-900 uppercase">
                {activeCodeMode === 'auto' ? 'Acak Otomatis' : 'Pilih Nomor Hoki'}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-150 font-bold uppercase">
              <span className="text-slate-500">Metode Pembayaran:</span>
              <span className="text-slate-900">
                {paymentMethod === 'cash' ? 'Tunai / Cash' : 'QRIS Digital'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#E70013] text-white text-center space-y-0.5 shadow-md">
            <span className="text-[11px] uppercase font-bold tracking-wider opacity-90">
              Total Pembayaran
            </span>
            <p className="text-3xl font-black font-mono">
              Rp {totalHarga.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={totalLembar <= 0 || isLoading || hasCustomCodeError || hasServerConflict || (paymentMethod === 'qris' && qrisNotConfigured)}
          className="w-full py-4 px-6 rounded-2xl font-black text-base shadow-md bg-[#E70013] hover:bg-[#E70013]/90 text-white cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2 border border-[#E70013] disabled:opacity-50 disabled:cursor-not-allowed"
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

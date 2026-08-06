import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Minus, Plus, CheckCircle2, Banknote, QrCode, Loader2, Dices, Hash, AlertCircle, CheckCircle, Gift, X, ArrowRight } from 'lucide-react';
import { generateDynamicQris, getSavedStaticQris } from '@/lib/services/qris';
import { checkCodeAvailable } from '@/lib/services/voucher';
import { Transaction } from '@/types';

interface TransactionFormProps {
  qtyFisik: number;
  qtyNonFisik: number;
  paymentMethod: 'cash' | 'qris' | 'free';
  isLoading?: boolean;
  conflictCode?: string;
  onClearConflict?: () => void;
  setQtyFisik: React.Dispatch<React.SetStateAction<number>>;
  setQtyNonFisik: React.Dispatch<React.SetStateAction<number>>;
  setPaymentMethod: (method: 'cash' | 'qris' | 'free') => void;
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
  const totalHarga = paymentMethod === 'free' ? 0 : totalLembar * 5000;
  const [qrisDataUrl, setQrisDataUrl] = useState<string>('');

  const [codeMode, setCodeMode] = useState<'auto' | 'custom'>('auto');
  const [customCodes, setCustomCodes] = useState<string[]>([]);
  const [customCodeStatuses, setCustomCodeStatuses] = useState<{ [key: number]: { available: boolean; formatted: string } }>({});
  const [customerName, setCustomerName] = useState<string>('');
  const [secondaryName, setSecondaryName] = useState<string>('');
  const [rt, setRt] = useState<string>('');
  const [rw, setRw] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [historyResults, setHistoryResults] = useState<Transaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const conflictBannerRef = useRef<HTMLDivElement>(null);
  const codeInputRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const nameInputRef = useRef<HTMLInputElement>(null);
  const lastAutofilledNameRef = useRef('');

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

  useEffect(() => {
    if (conflictCode) {
      conflictBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [conflictCode]);

  useEffect(() => {
    const q = customerName.trim();
    if (q.length < 3 || q === lastAutofilledNameRef.current) {
      setHistoryResults([]);
      setHistoryError('');
      setHistoryLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setHistoryLoading(true);
      setHistoryError('');
      try {
        const res = await fetch(`/api/transactions?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const data = await res.json();
        if (!res.ok) {
          setHistoryError(data.error || 'Gagal memuat riwayat.');
        } else {
          setHistoryResults(data.transactions || []);
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setHistoryError('Gagal terhubung ke server.');
        }
      } finally {
        if (!controller.signal.aborted) setHistoryLoading(false);
      }
    }, 400);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [customerName]);

  const hasCustomCodeError = Object.values(customCodeStatuses).some((s) => s.formatted && !s.available);
  const hasServerConflict = conflictCode !== '';

  useEffect(() => {
    if (hasCustomCodeError && !conflictCode) {
      const firstBadIdx = Object.keys(customCodeStatuses)
        .filter((idx) => {
          const s = customCodeStatuses[Number(idx)];
          return s.formatted && !s.available;
        })
        .map(Number)
        .sort((a, b) => a - b)[0];
      if (firstBadIdx !== undefined) {
        codeInputRefs.current.get(firstBadIdx)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [hasCustomCodeError, conflictCode, customCodeStatuses]);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setNameError('Nama Pembeli wajib diisi');
      nameInputRef.current?.focus();
      return;
    }
    setNameError('');
    setShowConfirmModal(true);
  };

  const handleSelectHistory = (tx: Transaction) => {
    const parts = (tx.customer_name || '').split(' - ').map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return;
    const [firstName, ...rest] = parts;
    let nextSecondary = '';
    let nextRt = '';
    let nextRw = '';
    for (const part of rest) {
      if (/^\d{1,3}$/.test(part)) {
        if (!nextRt) nextRt = part;
        else if (!nextRw) nextRw = part;
      } else {
        nextSecondary = nextSecondary ? `${nextSecondary} - ${part}` : part;
      }
    }
    lastAutofilledNameRef.current = firstName;
    setCustomerName(firstName);
    setSecondaryName(nextSecondary);
    setRt(nextRt);
    setRw(nextRw);
    if (tx.customer_phone) setCustomerPhone(tx.customer_phone);
    setNameError('');
    setHistoryResults([]);
    nameInputRef.current?.focus();
  };

  const buildCustomerName = () => {
    return [customerName.trim(), secondaryName.trim(), rt.trim(), rw.trim()].filter(Boolean).join(' - ');
  };

  const confirmPayment = () => {
    const activeCustomCodes = activeCodeMode === 'custom' ? customCodes.filter((c) => c.trim() !== '') : [];
    setShowConfirmModal(false);
    onSubmit({ preventDefault: () => {} } as React.FormEvent, activeCustomCodes, buildCustomerName(), customerPhone);
  };

  return (
    <form onSubmit={handleSubmitForm} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {conflictCode && (
        <div
          ref={conflictBannerRef}
          className="lg:col-span-2 flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#E70013] text-white text-sm font-black shadow-lg border-2 border-[#E70013] animate-fade-in"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 animate-pulse" />
          <span>
            Kode <span className="font-mono tracking-widest">{conflictCode}</span> ditolak server karena sudah terbit
            oleh kasir lain. Silakan ganti dengan angka lain.
          </span>
        </div>
      )}

      {/* Left Input Options */}
      <div className="space-y-6 bg-white border border-[#E70013]/20 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-black text-slate-900">1. Pilih Jenis & Jumlah Kupon</h2>

        {/* 1. Select Voucher Type */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600">Jenis Kupon:</label>
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
              <span className="text-sm font-black mt-1">Kupon Fisik</span>
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
              <span className="text-sm font-black mt-1">Kupon Digital</span>
              <span className="text-[11px] opacity-80">Kupon tautan digital</span>
            </button>
          </div>
        </div>

        {/* 2. Quantity Counter */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Jumlah {activeType === 'fisik' ? 'Kupon Fisik' : 'Kupon Digital'}
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
                    <div
                      key={idx}
                      ref={(el) => {
                        if (el) codeInputRefs.current.set(idx, el);
                        else codeInputRefs.current.delete(idx);
                      }}
                      className="relative"
                    >
                      <div className="relative flex items-center">
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
                                : 'border-[#E70013] bg-red-50'
                              : 'border-slate-200'
                          }`}
                        />
                        {isFilled && (
                          <div className="absolute right-2.5">
                            {isConflictSlot ? (
                              <span title="🔴 Ditolak server (sudah terbit oleh kasir lain)">
                                <AlertCircle className="w-4 h-4 text-[#E70013] animate-pulse" />
                              </span>
                            ) : isAvailable ? (
                              <span title="🟢 Kode Tersedia">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                              </span>
                            ) : (
                              <span title="🔴 Kode Sudah Terbit">
                                <AlertCircle className="w-4 h-4 text-[#E70013]" />
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {isFilled && !isAvailable && (
                        <p className="mt-1 text-[10px] font-bold text-[#E70013] flex items-center gap-1 pl-3 animate-fade-in">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          {isConflictSlot
                            ? 'Ditolak server — sudah terbit kasir lain'
                            : 'Sudah pernah terbit'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. Identitas Pemilik Kupon */}
        <div className="space-y-3 p-5 rounded-2xl border border-slate-200 bg-white">
          <label className="text-xs font-bold text-slate-900 block">
            3. Identitas Pemilik Kupon:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] text-slate-500 font-semibold mb-1 block">
                Nama Pembeli / Pemilik: <span className="text-[#E70013]">*</span>
              </label>
              <div className="relative">
                <input
                  ref={nameInputRef}
                  type="text"
                  placeholder="Contoh: Pak Budi / Bu Ani"
                  value={customerName}
                  onChange={(e) => {
                    lastAutofilledNameRef.current = '';
                    setCustomerName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  disabled={isLoading}
                  aria-invalid={!!nameError}
                  className={`w-full px-3.5 py-2 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E70013]/20 ${
                    nameError ? 'border-[#E70013] bg-red-50' : 'border-slate-300'
                  }`}
                />
                {historyLoading && customerName.trim().length >= 3 && (
                  <Loader2 className="absolute right-3 top-2.5 w-3.5 h-3.5 text-[#E70013] animate-spin" />
                )}
              </div>

              {nameError && (
                <p className="mt-1 text-[10px] font-bold text-[#E70013] flex items-center gap-1 pl-1 animate-fade-in">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {nameError}
                </p>
              )}

              {historyError && (
                <p className="mt-1.5 text-[10px] font-bold text-[#E70013] flex items-center gap-1 pl-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {historyError}
                </p>
              )}

              {!historyLoading && customerName.trim().length >= 3 && historyResults.length === 0 && !historyError && (
                <p className="mt-1.5 text-[10px] font-medium text-emerald-600 flex items-center gap-1 pl-1">
                  <CheckCircle className="w-3 h-3 flex-shrink-0" />
                  Tidak ada nama kembar untuk &ldquo;{customerName.trim()}&rdquo;.
                </p>
              )}

              {!historyLoading && historyResults.length > 0 && (
                <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-[10px] font-black text-amber-800 uppercase tracking-wide flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    Nama ini sudah pernah terbit — klik untuk isi otomatis
                  </p>
                  <div className="mt-1.5 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {historyResults.map((tx) => (
                      <button
                        key={tx.id}
                        type="button"
                        onClick={() => handleSelectHistory(tx)}
                        disabled={isLoading}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white border border-amber-200 hover:border-[#E70013] hover:shadow-sm transition-all cursor-pointer active:scale-[0.99] text-left disabled:opacity-50"
                      >
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-900 truncate">{tx.customer_name || 'Tanpa nama'}</p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            {tx.customer_phone ? ` · ${tx.customer_phone}` : ''}
                          </p>
                        </div>
                        <span className="flex-shrink-0 flex items-center gap-2">
                          <span className="text-[10px] font-black text-[#E70013]">
                            {(tx.qty_fisik || 0) + (tx.qty_non_fisik || 0)} lembar
                          </span>
                          <span className="text-[10px] font-black text-[#E70013] bg-red-50 border border-red-100 rounded-full px-2 py-0.5 whitespace-nowrap">
                            Isi Otomatis
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold mb-1 block">
                Nama Anak / Suami / Istri:
              </label>
              <input
                type="text"
                placeholder="Contoh: Diandra"
                value={secondaryName}
                onChange={(e) => setSecondaryName(e.target.value)}
                disabled={isLoading}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E70013]/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-semibold mb-1 block">RT:</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  placeholder="01"
                  value={rt}
                  onChange={(e) => setRt(e.target.value.replace(/\D/g, ''))}
                  disabled={isLoading}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E70013]/20"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-semibold mb-1 block">RW:</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  placeholder="05"
                  value={rw}
                  onChange={(e) => setRw(e.target.value.replace(/\D/g, ''))}
                  disabled={isLoading}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E70013]/20"
                />
              </div>
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
            🔒 Nama pemilik wajib diisi. Isi identitas lain agar kupon mudah dibedakan saat pencarian jika lupa token.
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

            <button
              type="button"
              onClick={() => setPaymentMethod('free')}
              disabled={isLoading}
              className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer active:scale-98 disabled:opacity-50 sm:col-span-2 ${
                paymentMethod === 'free'
                  ? 'bg-[#E70013] border-[#E70013] text-white shadow-md font-bold'
                  : 'bg-white border-slate-200 text-slate-800 hover:border-[#E70013]/40 font-medium'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">🎁</span>
                {paymentMethod === 'free' && <span className="text-[10px] font-bold uppercase text-white bg-white/20 px-2 py-0.5 rounded-full">Dipilih</span>}
              </div>
              <span className="text-sm font-black mt-1">Gratis / Donasi</span>
              <span className="text-[11px] opacity-80">Kupon untuk donatur — tanpa bayar</span>
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
              <span className="text-slate-500">Jumlah Kupon:</span>
              <span className="font-bold text-slate-900">
                {activeType === 'fisik' ? `Kupon Fisik (${qtyFisik} Lembar)` : `Kupon Digital (${qtyNonFisik} Lembar)`}
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
                {paymentMethod === 'cash' ? 'Tunai / Cash' : paymentMethod === 'qris' ? 'QRIS Digital' : 'Gratis / Donasi'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 text-white text-center space-y-0.5 shadow-md">
            <span className="text-[11px] uppercase font-bold tracking-wider opacity-70">
              Total Pembayaran
            </span>
            <p className="text-3xl font-black font-mono">
              Rp {totalHarga.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmitForm}
          disabled={totalLembar <= 0 || isLoading || hasCustomCodeError || hasServerConflict || (paymentMethod === 'qris' && qrisNotConfigured)}
          className="w-full py-4 px-6 rounded-2xl font-black text-base shadow-lg shadow-[#E70013]/30 bg-gradient-to-b from-[#FF4D5E] to-[#E70013] hover:from-[#E70013] hover:to-[#C20010] hover:shadow-xl hover:shadow-[#E70013]/40 active:scale-[0.98] text-white cursor-pointer transition-all flex items-center justify-center gap-2 border border-[#E70013] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
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
              : paymentMethod === 'qris'
              ? 'Proses Pembayaran QRIS'
              : 'Terbitkan Kupon Gratis'}
          </span>
          {!isLoading && <ArrowRight className="w-4 h-4 flex-shrink-0" />}
        </button>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                {paymentMethod === 'cash' ? (
                  <Banknote className="w-4 h-4 text-[#E70013]" />
                ) : paymentMethod === 'qris' ? (
                  <QrCode className="w-4 h-4 text-[#E70013]" />
                ) : (
                  <Gift className="w-4 h-4 text-[#E70013]" />
                )}
                Konfirmasi Pembayaran
              </h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-semibold text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah Kupon</span>
                <span className="font-bold text-slate-900">{totalLembar} lembar</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Metode</span>
                <span className="font-bold text-slate-900 uppercase">
                  {paymentMethod === 'cash'
                    ? 'Tunai / Cash'
                    : paymentMethod === 'qris'
                    ? 'QRIS Digital'
                    : 'Gratis / Donasi'}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-bold uppercase">Total</span>
                <span className="font-black text-[#E70013]">
                  Rp {totalHarga.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <p className="text-sm font-bold text-slate-800">
              {paymentMethod === 'free'
                ? 'Yakin terbitkan kupon gratis ini untuk donatur?'
                : paymentMethod === 'qris'
                ? 'Apakah pembayaran QRIS sudah masuk?'
                : 'Apakah uang sudah diterima kasir?'}
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                Belum / Batal
              </button>
              <button
                onClick={confirmPayment}
                className="flex-1 py-2.5 rounded-xl bg-[#E70013] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95 border border-[#E70013]"
              >
                <CheckCircle2 className="w-4 h-4" />
                {paymentMethod === 'free' ? 'Ya, Terbitkan Kupon' : 'Ya, Sudah Diterima'}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

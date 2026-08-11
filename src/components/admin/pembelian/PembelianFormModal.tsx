import React from 'react';
import { Loader2, X, Gift, Package, AlertCircle } from 'lucide-react';
import { Purchase } from '@/types';
import { formatRupiah } from '@/lib/format';

export type FundingSource = 'donasi' | 'penjualan_kupon' | 'donasi_barang';

interface PembelianFormModalProps {
  isOpen: boolean;
  editingPurchase: Purchase | null;
  isLoading: boolean;
  item: string;
  onItemChange: (value: string) => void;
  qty: string;
  onQtyChange: (value: string) => void;
  priceDisplay: string;
  onPriceInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isDoorprize: boolean;
  onIsDoorprizeChange: (value: boolean) => void;
  fundingSource: FundingSource;
  onFundingSourceChange: (value: FundingSource) => void;
  donorName: string;
  onDonorNameChange: (value: string) => void;
  note: string;
  onNoteChange: (value: string) => void;
  currentAvailableBalance: number;
  calculatedTotalPrice: number;
  isInsufficientBalance: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const PembelianFormModal = ({
  isOpen,
  editingPurchase,
  isLoading,
  item,
  onItemChange,
  qty,
  onQtyChange,
  priceDisplay,
  onPriceInputChange,
  isDoorprize,
  onIsDoorprizeChange,
  fundingSource,
  onFundingSourceChange,
  donorName,
  onDonorNameChange,
  note,
  onNoteChange,
  currentAvailableBalance,
  calculatedTotalPrice,
  isInsufficientBalance,
  onClose,
  onSubmit,
}: PembelianFormModalProps) => {
  if (!isOpen) return null;

  const isInKind = fundingSource === 'donasi_barang';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">
            {editingPurchase ? 'Edit Pengeluaran & Belanja' : 'Catat Pengeluaran & Belanja'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Nama Item Barang</label>
            <input
              type="text"
              value={item}
              onChange={(e) => onItemChange(e.target.value)}
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900 font-bold"
              placeholder="Contoh: Sepeda Listrik / Kipas Angin..."
            />
          </div>

          {/* Sumber Dana Selector */}
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">Sumber Dana Pengeluaran</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onFundingSourceChange('donasi')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  fundingSource === 'donasi'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <span>🎁 Donasi</span>
              </button>

              <button
                type="button"
                onClick={() => onFundingSourceChange('penjualan_kupon')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  fundingSource === 'penjualan_kupon'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <span>🎟️ Kupon</span>
              </button>

              <button
                type="button"
                onClick={() => onFundingSourceChange('donasi_barang')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  fundingSource === 'donasi_barang'
                    ? 'bg-violet-600 border-violet-600 text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <span>📦 Barang</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
              {isInKind
                ? '📦 Barang diberikan langsung donatur (tidak memakai kas). Isi nilai taksiran untuk urutan hadiah.'
                : fundingSource === 'donasi'
                ? `💰 Saldo Donasi Tersedia: ${formatRupiah(currentAvailableBalance)}`
                : `🎫 Saldo Kupon Tersedia: ${formatRupiah(currentAvailableBalance)}`}
            </p>
          </div>

          {/* Nama Donatur (khusus Donasi Barang) */}
          {isInKind && (
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Nama Donatur / Penyumbang Barang</label>
              <input
                type="text"
                value={donorName}
                onChange={(e) => onDonorNameChange(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900 font-bold"
                placeholder="Contoh: H. Ahmad / PT Sinar Mas"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Jumlah (Qty)</label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => onQtyChange(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900 font-bold"
                placeholder="Contoh: 2"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">
                {isInKind ? 'Nilai Taksiran Satuan (Rp)' : 'Harga Satuan (Rp)'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">Rp</span>
                <input
                  type="text"
                  value={priceDisplay}
                  onChange={onPriceInputChange}
                  required={!isInKind}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900 font-bold"
                  placeholder="1.750.000"
                />
              </div>
              {isInKind && (
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  Nilai taksiran opsional — dipakai untuk urutan hadiah & laporan. Kosongkan jika tidak diketahui.
                </p>
              )}
            </div>
          </div>

          {/* Total Price Auto Preview & Insufficient Balance Warning */}
          {calculatedTotalPrice > 0 && (
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              isInsufficientBalance
                ? 'bg-red-50 border-red-200 text-red-900'
                : isInKind
                ? 'bg-violet-50 border-violet-200 text-violet-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}>
              <span className="text-xs font-bold">
                {isInKind ? 'Total Nilai Taksiran Barang:' : 'Total Harga Belanja:'}
              </span>
              <span className="text-base font-black">{formatRupiah(calculatedTotalPrice)}</span>
            </div>
          )}

          {isInsufficientBalance && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-xl flex items-start gap-2.5 text-red-800 text-xs font-bold">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-extrabold">Saldo Kas Tidak Mencukupi!</p>
                <p className="font-medium text-[11px] mt-0.5">
                  Sisa Saldo Kas {fundingSource === 'donasi' ? 'Donasi & Sponsor' : 'Hasil Penjualan Kupon'} hanya {formatRupiah(currentAvailableBalance)}. Harap catat pemasukan terlebih dahulu sebelum membuat belanja.
                </p>
              </div>
            </div>
          )}

          {/* Apakah ini Doorprize? Selector */}
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">Apakah barang ini dijadikan Doorprize Undian?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onIsDoorprizeChange(true)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isDoorprize
                    ? 'bg-[#E70013] border-[#E70013] text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <Gift className="w-4 h-4" />
                <span>Ya (Doorprize)</span>
              </button>

              <button
                type="button"
                onClick={() => onIsDoorprizeChange(false)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  !isDoorprize
                    ? 'bg-slate-800 border-slate-800 text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Tidak (Operasional)</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
              {isDoorprize
                ? '🎁 Item akan otomatis terdaftar sebagai kategori & stok hadiah di panggung Undian.'
                : '📦 Item dicatat sebagai pengadaan belanja barang biasa (tidak masuk list undian).'}
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Catatan (opsional)</label>
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none h-20 resize-none text-slate-900"
              placeholder="Catatan tambahan..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || isInsufficientBalance}
              className="px-4 py-2 rounded-xl bg-[#E70013] text-white font-bold hover:bg-[#E70013]/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingPurchase ? 'Simpan Perubahan' : 'Simpan Pembelian'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

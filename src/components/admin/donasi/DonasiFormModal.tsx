import React from 'react';
import { Loader2, X } from 'lucide-react';
import { Donation } from '@/types';

interface DonasiFormModalProps {
  isOpen: boolean;
  editingDonation: Donation | null;
  isLoading: boolean;
  donorName: string;
  onDonorNameChange: (value: string) => void;
  donorPhone: string;
  onDonorPhoneChange: (value: string) => void;
  amountDisplay: string;
  onAmountInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  note: string;
  onNoteChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const DonasiFormModal = ({
  isOpen,
  editingDonation,
  isLoading,
  donorName,
  onDonorNameChange,
  donorPhone,
  onDonorPhoneChange,
  amountDisplay,
  onAmountInputChange,
  note,
  onNoteChange,
  onClose,
  onSubmit,
}: DonasiFormModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">
            {editingDonation ? 'Edit Pemasukan Donasi' : 'Tambah Pemasukan Donasi Baru'}
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
            <label className="text-xs font-bold text-slate-600 mb-1 block">Nama Donatur / Sponsor</label>
            <input
              type="text"
              value={donorName}
              onChange={(e) => onDonorNameChange(e.target.value)}
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900 font-bold"
              placeholder="Contoh: H. Ahmad / PT Sinar Mas"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Nomor WhatsApp / HP (opsional)</label>
            <input
              type="text"
              value={donorPhone}
              onChange={(e) => onDonorPhoneChange(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900"
              placeholder="Contoh: 081234567890"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Nominal Donasi (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">Rp</span>
              <input
                type="text"
                value={amountDisplay}
                onChange={onAmountInputChange}
                required
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none text-slate-900 font-bold text-base"
                placeholder="1.000.000"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Catatan / Keterangan (opsional)</label>
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#E70013] focus:outline-none h-20 resize-none text-slate-900"
              placeholder="Keterangan bantuan / bentuk barang yang dinilai uang..."
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
              disabled={isLoading || !donorName.trim() || !amountDisplay}
              className="px-4 py-2 rounded-xl bg-[#E70013] text-white font-bold hover:bg-[#E70013]/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingDonation ? 'Simpan Perubahan' : 'Simpan Donasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

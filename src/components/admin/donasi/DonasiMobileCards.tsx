import { Phone, CalendarDays, Edit, Trash2 } from 'lucide-react';
import { Donation } from '@/types';
import { formatRupiah } from '@/lib/format';

interface DonasiMobileCardsProps {
  donations: Donation[];
  onEdit: (d: Donation) => void;
  onDelete: (id: string) => void;
}

export const DonasiMobileCards = ({ donations, onEdit, onDelete }: DonasiMobileCardsProps) => {
  return (
    <div className="grid gap-3 p-4 md:hidden">
      {donations.length > 0 ? (
        donations.map((d) => (
          <div
            key={d.id}
            className="w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            {/* Header: avatar + nama */}
            <div className="flex items-start justify-between gap-3 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center text-sm font-black shrink-0">
                  {(d.donor_name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 leading-snug break-words">{d.donor_name}</p>
                  {d.donor_phone ? (
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 font-mono font-semibold break-all">
                      <Phone className="w-3 h-3 shrink-0 text-slate-400" />
                      {d.donor_phone}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Nominal */}
              <div className="shrink-0 flex flex-col items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-1.5">
                <strong className="text-xs sm:text-sm font-black text-emerald-700 leading-none text-right">
                  {formatRupiah(d.amount)}
                </strong>
              </div>
            </div>

            {/* Tanggal diterima */}
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
              {new Date(d.received_at).toLocaleDateString('id-ID')}
            </div>

            {/* Catatan */}
            {d.note ? (
              <div className="mt-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-1.5 text-xs text-slate-600 italic">
                {d.note}
              </div>
            ) : null}

            {/* Action footer */}
            <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => onEdit(d)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-[11px] font-bold hover:bg-slate-100 transition-colors cursor-pointer active:scale-95"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => onDelete(d.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-[11px] font-bold hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-2xl border border-slate-200 p-6 text-center text-slate-500 font-semibold">
          Belum ada data pemasukan donasi.
        </div>
      )}
    </div>
  );
};

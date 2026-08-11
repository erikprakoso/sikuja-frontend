import { TrendingUp, Wallet, ShoppingBag } from 'lucide-react';
import { formatRupiah } from '@/lib/format';

interface DonasiStatsCardsProps {
  totalDonations: number;
  totalSpentDonations: number;
  sisaDonasi: number;
  donationCount: number;
}

export const DonasiStatsCards = ({
  totalDonations,
  totalSpentDonations,
  sisaDonasi,
  donationCount,
}: DonasiStatsCardsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
      {/* Total Pemasukan & Sponsor */}
      <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pemasukan & Sponsor</span>
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-emerald-600 text-white shrink-0">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <p className="text-base sm:text-3xl font-black text-emerald-700 mt-1 sm:mt-1.5">
          {formatRupiah(totalDonations)}
        </p>
        <span className="hidden sm:block text-[11px] font-semibold text-slate-500 mt-1">{donationCount} transaksi penerimaan</span>
      </div>

      {/* Pengeluaran Terpakai (Donasi) */}
      <div className="bg-slate-100/60 border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Pengeluaran Terpakai</span>
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-900 text-white shrink-0">
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <p className="text-base sm:text-3xl font-black text-slate-900 mt-1 sm:mt-1.5">
          {formatRupiah(totalSpentDonations)}
        </p>
        <span className="hidden sm:block text-[11px] font-semibold text-slate-500 mt-1">Belanja dari sumber Donasi</span>
      </div>

      {/* Sisa Saldo Donasi & Sponsor */}
      <div className="bg-blue-50/50 border border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Sisa Saldo Donasi & Sponsor</span>
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-blue-600 text-white shrink-0">
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <p className="text-base sm:text-3xl font-black text-blue-700 mt-1 sm:mt-1.5">
          {formatRupiah(sisaDonasi)}
        </p>
        <span className="hidden sm:block text-[11px] font-semibold text-slate-500 mt-1">Saldo bersih Donasi & Sponsor</span>
      </div>
    </div>
  );
};

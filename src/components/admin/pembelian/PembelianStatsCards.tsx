import { ShoppingBag, PackageCheck, Gift, Package, Trophy } from 'lucide-react';
import { formatRupiah } from '@/lib/format';

interface PembelianStatsCardsProps {
  totalSpent: number;
  totalSpentBarang: number;
  sisaDonasi: number;
  totalDonations: number;
  sisaKupon: number;
  voucherSales: number;
  sisaKas: number;
  purchaseCount: number;
}

export const PembelianStatsCards = ({
  totalSpent,
  totalSpentBarang,
  sisaDonasi,
  totalDonations,
  sisaKupon,
  voucherSales,
  sisaKas,
  purchaseCount,
}: PembelianStatsCardsProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
      {/* Total Pengeluaran */}
      <div className="bg-slate-100/60 border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pengeluaran</span>
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-900 text-white shrink-0">
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <p className="text-base sm:text-2xl font-black text-slate-900 mt-1 sm:mt-1.5">
          {formatRupiah(totalSpent)}
        </p>
        <span className="hidden sm:block text-[11px] font-semibold text-slate-500 mt-1">{purchaseCount} transaksi</span>
      </div>

      {/* Total Donasi Barang (In-Kind) */}
      <div className="bg-violet-50/50 border border-violet-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Total Donasi Barang</span>
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-violet-600 text-white shrink-0">
            <PackageCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <p className="text-base sm:text-2xl font-black text-violet-700 mt-1 sm:mt-1.5">
          {formatRupiah(totalSpentBarang)}
        </p>
        <span className="hidden sm:block text-[11px] font-semibold text-slate-500 mt-1">Hadiah langsung dari donatur (in-kind)</span>
      </div>

      {/* Sisa Donasi / Sponsor */}
      <div className="bg-blue-50/50 border border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Sisa Saldo Donasi/Sponsor</span>
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-blue-600 text-white shrink-0">
            <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <p className="text-base sm:text-2xl font-black text-blue-700 mt-1 sm:mt-1.5">
          {formatRupiah(sisaDonasi)}
        </p>
        <span className="hidden sm:block text-[11px] font-semibold text-slate-500 mt-1">Total Masuk: {formatRupiah(totalDonations)}</span>
      </div>

      {/* Sisa Penjualan Kupon */}
      <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Sisa Saldo Penjualan Kupon</span>
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-emerald-600 text-white shrink-0">
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <p className="text-base sm:text-2xl font-black text-emerald-700 mt-1 sm:mt-1.5">
          {formatRupiah(sisaKupon)}
        </p>
        <span className="hidden sm:block text-[11px] font-semibold text-slate-500 mt-1">Total Masuk: {formatRupiah(voucherSales)}</span>
      </div>

      {/* Total Sisa Kas Panitia */}
      <div className="bg-amber-50/50 border border-amber-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sisa Kas Panitia</span>
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-amber-500 text-white shrink-0">
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <p className="text-base sm:text-2xl font-black text-amber-600 mt-1 sm:mt-1.5">
          {formatRupiah(sisaKas)}
        </p>
        <span className="hidden sm:block text-[11px] font-semibold text-slate-500 mt-1">Gabungan Seluruh Kas</span>
      </div>
    </div>
  );
};

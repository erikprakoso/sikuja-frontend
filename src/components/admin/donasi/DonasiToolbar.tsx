import { Search, Loader2 } from 'lucide-react';

interface DonasiToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortValue: string;
  onSortChange: (value: string) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  isLoading: boolean;
}

export const DonasiToolbar = ({
  searchQuery,
  onSearchChange,
  sortValue,
  onSortChange,
  pageSize,
  onPageSizeChange,
  isLoading,
}: DonasiToolbarProps) => {
  return (
    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari nama donatur atau nominal..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#E70013] focus:outline-none transition-all text-slate-900"
        />
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">Urutkan:</span>
        <select
          value={sortValue}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
        >
          <option value="date-desc">Tanggal Terbaru</option>
          <option value="date-asc">Tanggal Terlama</option>
          <option value="amount-desc">Nominal Terbesar</option>
          <option value="amount-asc">Nominal Terkecil</option>
        </select>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">Tampilkan:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
        >
          <option value={10}>10 per hlm</option>
          <option value={25}>25 per hlm</option>
          <option value={50}>50 per hlm</option>
          <option value={100}>100 per hlm</option>
        </select>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      </div>
    </div>
  );
};

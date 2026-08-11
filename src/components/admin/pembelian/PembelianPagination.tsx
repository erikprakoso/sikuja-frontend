import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PembelianPaginationProps {
  totalCount: number;
  startIndex: number;
  endIndex: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const PembelianPagination = ({
  totalCount,
  startIndex,
  endIndex,
  currentPage,
  totalPages,
  onPageChange,
}: PembelianPaginationProps) => {
  if (totalCount <= 0) return null;

  return (
    <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-600">
      <span>
        Menampilkan <strong className="font-black text-slate-900">{startIndex + 1}</strong>–
        <strong className="font-black text-slate-900">{endIndex}</strong> dari{' '}
        <strong className="font-black text-slate-900">{totalCount}</strong> pembelian
      </span>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer active:scale-95"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const visibleCount = Math.min(5, totalPages);
            const windowStart = Math.max(
              1,
              Math.min(currentPage - Math.floor(visibleCount / 2), totalPages - visibleCount + 1)
            );
            const pageNum = windowStart + i;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer active:scale-95 border ${
                  currentPage === pageNum
                    ? 'bg-[#E70013] border-[#E70013] text-white shadow-xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer active:scale-95"
          title="Halaman Selanjutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

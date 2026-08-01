import React, { useState, useMemo } from 'react';
import { DrawResult } from '@/types';
import { Trophy, CheckCircle2, Loader2, Filter } from 'lucide-react';

interface UnclaimedWinnersListProps {
  unclaimedWinners: DrawResult[];
  processingCode: string | null;
  onQuickClaim: (code: string) => void;
}

export const UnclaimedWinnersList: React.FC<UnclaimedWinnersListProps> = ({
  unclaimedWinners,
  processingCode,
  onQuickClaim,
}) => {
  const [filterPrize, setFilterPrize] = useState<string>('');

  const uniquePrizes = useMemo(() => {
    const prizes = new Set(unclaimedWinners.map((w) => w.prize_name));
    return Array.from(prizes);
  }, [unclaimedWinners]);

  const filteredWinners = useMemo(() => {
    if (!filterPrize) return unclaimedWinners;
    return unclaimedWinners.filter((w) => w.prize_name === filterPrize);
  }, [unclaimedWinners, filterPrize]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#E70013]" />
          Daftar Pemenang Menunggu Klaim ({unclaimedWinners.length})
        </h2>

        {uniquePrizes.length > 1 && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterPrize}
              onChange={(e) => setFilterPrize(e.target.value)}
              className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E70013]/20"
            >
              <option value="">Semua Hadiah</option>
              {uniquePrizes.map((prize) => (
                <option key={prize} value={prize}>{prize}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {filteredWinners.length === 0 ? (
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-semibold">
          {filterPrize ? `Tidak ada pemenang "${filterPrize}" yang belum diklaim.` : 'Tidak ada daftar pemenang yang belum diklaim.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredWinners.map((res) => {
            const isProcessing = processingCode === res.voucher_code;
            return (
              <div
                key={res.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4 transition-all ${
                  isProcessing ? 'border-[#E70013] ring-2 ring-[#E70013]/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500">
                    Hadiah: {res.prize_name}
                  </span>
                  <p className="text-2xl font-black text-slate-900 font-mono tracking-widest">
                    {res.voucher_code}
                  </p>
                  {res.customer_name && (
                    <p className="text-xs font-semibold text-[#E70013]">
                      {res.customer_name}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 font-semibold">
                    Waktu Undi: {new Date(res.drawn_at).toLocaleTimeString('id-ID')}
                  </p>
                </div>

                <button
                  onClick={() => onQuickClaim(res.voucher_code)}
                  disabled={processingCode !== null}
                  className="px-4 py-2 rounded-xl bg-[#E70013] hover:bg-[#E70013]/90 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer active:scale-95 border border-[#E70013] disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Proses Klaim
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

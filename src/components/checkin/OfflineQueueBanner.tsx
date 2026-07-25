import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface OfflineQueueBannerProps {
  queueCount: number;
  onSync: () => void;
}

export const OfflineQueueBanner: React.FC<OfflineQueueBannerProps> = ({
  queueCount,
  onSync,
}) => {
  if (queueCount <= 0) return null;

  return (
    <div className="p-4 rounded-2xl bg-white border border-[#E70013]/25 text-[#E70013] text-xs flex items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-2.5">
        <WifiOff className="w-5 h-5 text-[#E70013] animate-pulse flex-shrink-0" />
        <div>
          <p className="font-bold">Terdapat {queueCount} data validasi dalam antrean lokal (offline).</p>
          <p className="text-[11px] text-[#E70013]/70 font-semibold mt-0.5">
            Data tersimpan otomatis di perangkat dan siap disinkronkan saat terhubung kembali.
          </p>
        </div>
      </div>
      <button
        onClick={onSync}
        className="px-3.5 py-2 rounded-xl bg-[#E70013] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 flex-shrink-0 transition-all cursor-pointer active:scale-95 border border-[#E70013]"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Sinkronkan Data
      </button>
    </div>
  );
};

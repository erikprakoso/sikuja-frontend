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
    <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-700/80 text-amber-200 text-xs flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <WifiOff className="w-5 h-5 text-amber-400 animate-pulse flex-shrink-0" />
        <div>
          <p className="font-bold">Ada {queueCount} data scan tersimpan offline!</p>
          <p className="text-[11px] text-amber-300/80">
            Data akan tersimpan di HP ini sampai jaringan terhubung kembali.
          </p>
        </div>
      </div>
      <button
        onClick={onSync}
        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md flex items-center gap-1 flex-shrink-0"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Sync Now
      </button>
    </div>
  );
};

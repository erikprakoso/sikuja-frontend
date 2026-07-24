import React from 'react';
import { AlertCircle } from 'lucide-react';

interface PinDotsIndicatorProps {
  pinLength: number;
  error?: string;
}

export const PinDotsIndicator: React.FC<PinDotsIndicatorProps> = ({ pinLength, error }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-center items-center gap-4 py-2">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className={`w-5 h-5 rounded-full border-2 transition-all ${
              pinLength > idx
                ? 'bg-red-500 border-red-400 scale-110 shadow-md shadow-red-500/50'
                : 'bg-slate-950 border-slate-700'
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs font-semibold flex items-center justify-center gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
};

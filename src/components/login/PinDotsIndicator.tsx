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
            className={`w-5 h-5 rounded-full border-2 border-[#E70013] transition-all ${
              pinLength > idx
                ? 'bg-[#E70013] scale-110 shadow-md'
                : 'bg-white'
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[#E70013] text-white text-xs font-black flex items-center justify-center gap-2 animate-shake shadow">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
};

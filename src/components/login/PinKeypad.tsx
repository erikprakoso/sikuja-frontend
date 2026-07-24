import React from 'react';
import { Delete } from 'lucide-react';

interface PinKeypadProps {
  onKeyPress: (num: string) => void;
  onClear: () => void;
  onDelete: () => void;
}

export const PinKeypad: React.FC<PinKeypadProps> = ({
  onKeyPress,
  onClear,
  onDelete,
}) => {
  return (
    <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
        <button
          key={num}
          onClick={() => onKeyPress(num)}
          className="h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-xl font-bold text-white shadow-md transition-all border border-slate-700/50 flex items-center justify-center"
        >
          {num}
        </button>
      ))}
      <button
        onClick={onClear}
        className="h-14 rounded-2xl bg-slate-950 hover:bg-slate-900 active:scale-95 text-xs font-bold text-slate-400 transition-all border border-slate-800 flex items-center justify-center uppercase tracking-wider"
      >
        Reset
      </button>
      <button
        onClick={() => onKeyPress('0')}
        className="h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-xl font-bold text-white shadow-md transition-all border border-slate-700/50 flex items-center justify-center"
      >
        0
      </button>
      <button
        onClick={onDelete}
        className="h-14 rounded-2xl bg-red-950/60 hover:bg-red-900/80 active:scale-95 text-red-300 transition-all border border-red-800/60 flex items-center justify-center"
      >
        <Delete className="w-5 h-5" />
      </button>
    </div>
  );
};

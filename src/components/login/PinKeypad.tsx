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
          className="h-14 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-[#171717] active:scale-95 text-xl font-black shadow-xs transition-all flex items-center justify-center cursor-pointer font-mono"
        >
          {num}
        </button>
      ))}
      <button
        onClick={onClear}
        className="h-14 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-600 active:scale-95 text-xs font-bold transition-all flex items-center justify-center uppercase tracking-wider cursor-pointer"
      >
        Reset
      </button>
      <button
        onClick={() => onKeyPress('0')}
        className="h-14 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-[#171717] active:scale-95 text-xl font-black shadow-xs transition-all flex items-center justify-center cursor-pointer font-mono"
      >
        0
      </button>
      <button
        onClick={onDelete}
        className="h-14 rounded-2xl bg-[#E70013] hover:bg-[#E70013]/90 active:scale-95 text-white transition-all border border-[#E70013] flex items-center justify-center cursor-pointer shadow-xs"
      >
        <Delete className="w-5 h-5" />
      </button>
    </div>
  );
};

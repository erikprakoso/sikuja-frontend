import React from 'react';
import { Search, CheckSquare, CheckCircle2, AlertCircle } from 'lucide-react';

interface VerifikasiFormProps {
  code: string;
  setCode: (val: string) => void;
  resultMsg: { success: boolean; message: string } | null;
  onVerify: (e: React.FormEvent) => void;
}

export const VerifikasiForm: React.FC<VerifikasiFormProps> = ({
  code,
  setCode,
  resultMsg,
  onVerify,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      <form onSubmit={onVerify} className="space-y-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
          🔍 Input 5-Digit Kode Voucher Pemenang di Panggung:
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Contoh: 05678..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={5}
              className="w-full pl-10 pr-4 py-3.5 bg-slate-950 border border-slate-700 rounded-2xl text-white font-mono text-xl tracking-widest placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <Search className="absolute left-3.5 top-4 w-5 h-5 text-slate-400" />
          </div>

          <button
            type="submit"
            disabled={!code.trim()}
            className="px-8 py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2"
          >
            <CheckSquare className="w-5 h-5" />
            Tandai Diklaim
          </button>
        </div>
      </form>

      {resultMsg && (
        <div
          className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-3 animate-fade-in ${
            resultMsg.success
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
              : 'bg-red-950/80 border-red-800 text-red-200'
          }`}
        >
          {resultMsg.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          )}
          <p>{resultMsg.message}</p>
        </div>
      )}
    </div>
  );
};

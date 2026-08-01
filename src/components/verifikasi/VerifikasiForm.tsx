import React, { useEffect, useRef } from 'react';
import { Search, CheckSquare, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface VerifikasiFormProps {
  code: string;
  setCode: (val: string) => void;
  resultMsg: { success: boolean; message: string } | null;
  isVerifying: boolean;
  onVerify: (e: React.FormEvent) => void;
}

export const VerifikasiForm: React.FC<VerifikasiFormProps> = ({
  code,
  setCode,
  resultMsg,
  isVerifying,
  onVerify,
}) => {
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (resultMsg) {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => {
        setCode('');
      }, 4000);
    }
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, [resultMsg, setCode]);
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <form onSubmit={onVerify} className="space-y-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Masukkan Kode Kupon Pemenang:
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Ketik 5-digit kode kupon..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={5}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-300 focus:border-[#E70013] focus:ring-2 focus:ring-[#E70013]/20 rounded-2xl text-slate-900 font-mono text-xl tracking-widest font-black placeholder-slate-400 focus:outline-none transition-all"
            />
            <Search className="absolute left-4 top-4.5 w-5 h-5 text-slate-400" />
          </div>

          <button
            type="submit"
            disabled={!code.trim() || isVerifying}
            className="px-8 py-3.5 rounded-2xl bg-[#E70013] hover:bg-[#E70013]/90 disabled:opacity-50 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 border border-[#E70013] disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <CheckSquare className="w-5 h-5" />
                Verifikasi Klaim
              </>
            )}
          </button>
        </div>
      </form>

      {resultMsg && (
        <div
          className={`p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 animate-fade-in ${
            resultMsg.success
              ? 'bg-emerald-900 text-white border-emerald-900 shadow-md'
              : 'bg-red-50 border-red-200 text-red-700 shadow-xs'
          }`}
        >
          {resultMsg.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <p>{resultMsg.message}</p>
        </div>
      )}
    </div>
  );
};

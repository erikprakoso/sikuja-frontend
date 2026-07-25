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
    <div className="bg-white border-4 border-[#E70013] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      <form onSubmit={onVerify} className="space-y-4">
        <label className="block text-xs font-black uppercase tracking-wider text-[#E70013]">
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
              className="w-full pl-10 pr-4 py-3.5 bg-white border-2 border-[#E70013] rounded-2xl text-[#E70013] font-mono text-xl tracking-widest font-black placeholder-[#E70013]/50 focus:outline-none"
            />
            <Search className="absolute left-3.5 top-4 w-5 h-5 text-[#E70013]" />
          </div>

          <button
            type="submit"
            disabled={!code.trim()}
            className="px-8 py-3.5 rounded-2xl bg-[#E70013] hover:bg-[#E70013]/90 disabled:opacity-50 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 border-2 border-[#E70013]"
          >
            <CheckSquare className="w-5 h-5" />
            Verifikasi Klaim
          </button>
        </div>
      </form>

      {resultMsg && (
        <div
          className={`p-4 rounded-2xl border-4 text-sm font-black flex items-center gap-3 animate-fade-in ${
            resultMsg.success
              ? 'bg-[#E70013] border-[#E70013] text-white'
              : 'bg-white border-[#E70013] text-[#E70013]'
          }`}
        >
          {resultMsg.success ? (
            <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-[#E70013] flex-shrink-0" />
          )}
          <p>{resultMsg.message}</p>
        </div>
      )}
    </div>
  );
};

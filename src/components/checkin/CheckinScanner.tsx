import React from 'react';
import { Camera, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface CheckinScannerProps {
  scannerContainerId: string;
  isScanning: boolean;
  isProcessing?: boolean;
  inputCode: string;
  setInputCode: (val: string) => void;
  resultMessage: { success: boolean; text: string } | null;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onSubmitCode: (code: string) => void;
}

export const CheckinScanner: React.FC<CheckinScannerProps> = ({
  scannerContainerId,
  isScanning,
  isProcessing = false,
  inputCode,
  setInputCode,
  resultMessage,
  onStartCamera,
  onStopCamera,
  onSubmitCode,
}) => {
  return (
    <div className="bg-white border border-[#E70013]/20 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Camera Feed Container */}
      <div className="space-y-4">
        <div
          id={scannerContainerId}
          style={{ display: isScanning ? 'block' : 'none' }}
          className="w-full overflow-hidden rounded-2xl border border-slate-300 bg-black min-h-[300px]"
        />

        {!isScanning ? (
          <button
            onClick={onStartCamera}
            disabled={isProcessing}
            className="w-full py-4 rounded-2xl bg-[#E70013] hover:bg-[#E70013]/90 disabled:opacity-50 text-white font-black text-base shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98] border border-[#E70013]"
          >
            <Camera className="w-5 h-5 text-white" />
            Aktifkan Kamera & Pindai QR Code
          </button>
        ) : (
          <button
            onClick={onStopCamera}
            disabled={isProcessing}
            className="w-full py-3 rounded-2xl bg-white text-slate-800 hover:bg-slate-100 font-bold text-sm border border-slate-300 transition-all cursor-pointer active:scale-95"
          >
            Nonaktifkan Kamera
          </button>
        )}
      </div>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-slate-200 w-full" />
        <span className="bg-white px-3 text-xs text-slate-500 uppercase font-bold tracking-wider absolute">
          Atau Masukkan Kode Manual
        </span>
      </div>

      {/* Manual Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmitCode(inputCode);
        }}
        className="flex flex-col sm:flex-row gap-2.5"
      >
        <input
          type="text"
          placeholder="Masukkan 5-digit kode kupon / token..."
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          disabled={isProcessing}
          className="flex-1 px-4 py-3 bg-white border border-slate-300 focus:border-[#E70013] focus:ring-2 focus:ring-[#E70013]/20 rounded-2xl text-slate-900 font-mono text-base font-bold placeholder-slate-400 focus:outline-none disabled:opacity-50 transition-all"
        />
        <button
          type="submit"
          disabled={!inputCode.trim() || isProcessing}
          className="px-6 py-3 rounded-2xl bg-[#E70013] hover:bg-[#E70013]/90 disabled:opacity-50 text-white font-black text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 border border-[#E70013]"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          <span>{isProcessing ? 'Memproses...' : 'Verifikasi'}</span>
        </button>
      </form>

      {/* Processing Indicator Banner */}
      {isProcessing && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold flex items-center justify-center gap-3 animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin text-[#E70013] flex-shrink-0" />
          <span>Memproses verifikasi kode kupon... Mohon tunggu.</span>
        </div>
      )}

      {/* Result Alert Box */}
      {!isProcessing && resultMessage && (
        <div
          className={`p-4 rounded-2xl border text-sm font-bold flex items-start gap-3 animate-fade-in ${
            resultMessage.success
              ? 'bg-emerald-900 text-white border-emerald-900 shadow-md'
              : 'bg-red-50 border-red-200 text-red-700 shadow-xs'
          }`}
        >
          {resultMessage.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-bold">{resultMessage.text}</p>
          </div>
        </div>
      )}
    </div>
  );
};

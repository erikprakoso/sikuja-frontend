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
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Camera Feed Container */}
      <div className="space-y-4">
        <div
          id={scannerContainerId}
          style={{ display: isScanning ? 'block' : 'none' }}
          className="w-full overflow-hidden rounded-2xl border-2 border-emerald-500 bg-black min-h-[300px]"
        />

        {!isScanning ? (
          <button
            onClick={onStartCamera}
            disabled={isProcessing}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-lg shadow-xl shadow-emerald-950/60 transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.98] disabled:cursor-not-allowed"
          >
            <Camera className="w-6 h-6" />
            Aktifkan Kamera & Pindai QR Code
          </button>
        ) : (
          <button
            onClick={onStopCamera}
            disabled={isProcessing}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-sm border border-slate-700 transition-all cursor-pointer active:scale-95 disabled:cursor-not-allowed"
          >
            Nonaktifkan Kamera
          </button>
        )}
      </div>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-slate-800 w-full" />
        <span className="bg-slate-900 px-3 text-xs text-slate-500 uppercase font-bold absolute">
          Atau Masukkan Kode Manual
        </span>
      </div>

      {/* Manual Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmitCode(inputCode);
        }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <input
          type="text"
          placeholder="Masukkan 5-digit kode kupon atau token..."
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          disabled={isProcessing}
          className="flex-1 px-4 py-3.5 bg-slate-950 border border-slate-700 rounded-2xl text-white font-mono text-base placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputCode.trim() || isProcessing}
          className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          <span>{isProcessing ? 'Memproses...' : 'Verifikasi'}</span>
        </button>
      </form>

      {/* Processing / Loading Indicator Banner */}
      {isProcessing && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/50 text-cyan-300 text-sm font-semibold flex items-center justify-center gap-3 animate-pulse shadow-lg">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-400 flex-shrink-0" />
          <span>Memproses verifikasi kode kupon... Mohon tunggu.</span>
        </div>
      )}

      {/* Result Alert Box (Only shown when not processing) */}
      {!isProcessing && resultMessage && (
        <div
          className={`p-4 rounded-2xl border text-sm font-semibold flex items-start gap-3 animate-fade-in ${
            resultMessage.success
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
              : 'bg-red-950/80 border-red-800 text-red-200'
          }`}
        >
          {resultMessage.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-bold">{resultMessage.text}</p>
          </div>
        </div>
      )}
    </div>
  );
};

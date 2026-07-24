import React from 'react';
import { Camera, CheckCircle2, AlertCircle } from 'lucide-react';

interface CheckinScannerProps {
  scannerContainerId: string;
  isScanning: boolean;
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
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-lg shadow-xl shadow-emerald-950/60 transition-all flex items-center justify-center gap-3"
          >
            <Camera className="w-6 h-6" />
            Buka Kamera HP & Scan QR
          </button>
        ) : (
          <button
            onClick={onStopCamera}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700"
          >
            Tutup Kamera
          </button>
        )}
      </div>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-slate-800 w-full" />
        <span className="bg-slate-900 px-3 text-xs text-slate-500 uppercase font-bold absolute">
          Atau Input Manual
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
          placeholder="Ketik 5-digit kode atau token transaksi..."
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          className="flex-1 px-4 py-3.5 bg-slate-950 border border-slate-700 rounded-2xl text-white font-mono text-base placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={!inputCode.trim()}
          className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Check-In
        </button>
      </form>

      {/* Result Alert Box */}
      {resultMessage && (
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

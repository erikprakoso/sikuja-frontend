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
    <div className="bg-white border-4 border-[#E70013] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      {/* Camera Feed Container */}
      <div className="space-y-4">
        <div
          id={scannerContainerId}
          style={{ display: isScanning ? 'block' : 'none' }}
          className="w-full overflow-hidden rounded-2xl border-4 border-[#E70013] bg-white min-h-[300px]"
        />

        {!isScanning ? (
          <button
            onClick={onStartCamera}
            disabled={isProcessing}
            className="w-full py-5 rounded-2xl bg-[#E70013] hover:bg-[#E70013]/90 disabled:opacity-50 text-white font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.98] border-2 border-[#E70013]"
          >
            <Camera className="w-6 h-6 text-white" />
            Aktifkan Kamera & Pindai QR Code
          </button>
        ) : (
          <button
            onClick={onStopCamera}
            disabled={isProcessing}
            className="w-full py-3 rounded-2xl bg-white text-[#E70013] hover:bg-[#E70013] hover:text-white font-black text-sm border-2 border-[#E70013] transition-all cursor-pointer active:scale-95"
          >
            Nonaktifkan Kamera
          </button>
        )}
      </div>

      <div className="relative flex items-center justify-center">
        <div className="border-t-2 border-[#E70013] w-full" />
        <span className="bg-white px-3 text-xs text-[#E70013] uppercase font-black absolute">
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
          className="flex-1 px-4 py-3.5 bg-white border-2 border-[#E70013] rounded-2xl text-[#E70013] font-mono text-base font-black placeholder-[#E70013]/50 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputCode.trim() || isProcessing}
          className="px-6 py-3.5 rounded-2xl bg-[#E70013] hover:bg-[#E70013]/90 disabled:opacity-50 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 border-2 border-[#E70013]"
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
        <div className="p-4 rounded-2xl bg-white border-4 border-[#E70013] text-[#E70013] text-sm font-black flex items-center justify-center gap-3 animate-pulse shadow-md">
          <Loader2 className="w-5 h-5 animate-spin text-[#E70013] flex-shrink-0" />
          <span>Memproses verifikasi kode kupon... Mohon tunggu.</span>
        </div>
      )}

      {/* Result Alert Box */}
      {!isProcessing && resultMessage && (
        <div
          className={`p-4 rounded-2xl border-4 text-sm font-black flex items-start gap-3 animate-fade-in ${
            resultMessage.success
              ? 'bg-[#E70013] border-[#E70013] text-white'
              : 'bg-white border-[#E70013] text-[#E70013]'
          }`}
        >
          {resultMessage.success ? (
            <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-[#E70013] flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-black">{resultMessage.text}</p>
          </div>
        </div>
      )}
    </div>
  );
};

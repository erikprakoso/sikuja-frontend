import React, { useState, useEffect } from 'react';
import { Transaction, Voucher } from '@/types';
import {
  isBluetoothSupported,
  canAutoReconnect,
  isPrinterConnected,
  connectPrinter,
  tryReconnectLastPrinter,
  onPrinterDisconnect,
  getPrinterLastConnectedName,
  printThermalReceipt,
} from '@/lib/printer';
import { ReceiptView } from '@/components/penjualan/ReceiptView';
import { Printer, X, Bluetooth, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ThermalReceiptModalProps {
  transaction: Transaction;
  vouchers: Voucher[];
  onClose: () => void;
}

type PrinterStatus = 'unsupported' | 'idle' | 'connecting' | 'connected';

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  transaction,
  vouchers,
  onClose,
}) => {
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>(() =>
    typeof window !== 'undefined' && isBluetoothSupported()
      ? isPrinterConnected()
        ? 'connected'
        : 'idle'
      : 'unsupported'
  );
  const [printerName, setPrinterName] = useState<string | null>(() =>
    typeof window !== 'undefined' ? getPrinterLastConnectedName() : null
  );
  const [printerError, setPrinterError] = useState<string>('');
  const [printMsg, setPrintMsg] = useState<string>('');

  useEffect(() => {
    if (printerStatus === 'unsupported') return;

    onPrinterDisconnect(() => {
      setPrinterStatus('idle');
      setPrintMsg('');
    });

    // Sudah connected ditangani di inisialisasi state awal.
    if (printerStatus === 'connected') return;

    void tryReconnectLastPrinter().then((ok) => {
      if (ok) {
        setPrinterName(getPrinterLastConnectedName());
        setPrinterStatus('connected');
      }
    });

    return () => {
      onPrinterDisconnect(null);
    };
  }, [printerStatus]);

  const handleConnect = async () => {
    setPrinterError('');
    setPrintMsg('');
    setPrinterStatus('connecting');
    try {
      const name = await connectPrinter();
      setPrinterName(name);
      setPrinterStatus('connected');
    } catch (err) {
      setPrinterStatus('idle');
      setPrinterError(err instanceof Error ? err.message : String(err));
    }
  };

  const handlePrint = async () => {
    setPrinterError('');
    setPrintMsg('');

    if (printerStatus !== 'connected') {
      // Android: coba sambung ulang senyap dulu (tanpa dialog).
      const reconnected = await tryReconnectLastPrinter();
      if (reconnected) {
        setPrinterName(getPrinterLastConnectedName());
        setPrinterStatus('connected');
      } else {
        // Desktop: wajib dialog pilih perangkat (requestDevice). Sekalian saja
        // biar cukup sekali klik "Cetak Struk" = pilih printer + cetak.
        setPrintMsg('Pilih printer thermal di dialog Bluetooth...');
        try {
          const name = await connectPrinter();
          setPrinterName(name);
          setPrinterStatus('connected');
        } catch (err) {
          setPrinterStatus('idle');
          setPrintMsg('');
          setPrinterError(
            `Printer tidak dipilih: ${err instanceof Error ? err.message : 'dialog dibatalkan'}. Coba lagi dengan menekan Cetak Struk.`
          );
          return;
        }
      }
    }

    try {
      setPrintMsg('Mencetak struk...');
      await printThermalReceipt(transaction, vouchers);
      setPrintMsg('Struk berhasil dicetak ke printer thermal ✓');
      setTimeout(() => setPrintMsg(''), 4000);
    } catch (err) {
      setPrinterError(err instanceof Error ? err.message : String(err));
      setPrintMsg('');
    }
  };

  const handlePrintViaBrowser = () => {
    setPrinterError('');
    setPrintMsg('');
    window.print();
  };

  const printerStatusLabel = () => {
    switch (printerStatus) {
      case 'unsupported':
        return 'Printer Thermal tidak didukung browser ini';
      case 'connecting':
        return 'Menghubungkan printer...';
      case 'connected':
        return `Printer Terhubung${printerName ? ` (${printerName})` : ''}`;
      default:
        return printerName ? `Printer terakhir: ${printerName}` : 'Belum terhubung printer thermal';
    }
  };

  const printerStatusDetail = () => {
    switch (printerStatus) {
      case 'unsupported':
        return 'Gunakan tombol Cetak via Browser sebagai gantinya.';
      case 'connecting':
        return 'Pilih printer thermal di dialog Bluetooth.';
      case 'connected':
        return 'Cetak Struk akan langsung dikirim ke printer, tanpa preview.';
      default:
        return canAutoReconnect()
          ? 'Sambungan mati saat halaman dimuat ulang — coba sambung otomatis lalu cetak.'
          : 'Chrome desktop tidak bisa sambung otomatis. Hubungkan sekali per sesi, lalu cetak.';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full space-y-6 shadow-2xl relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Printer className="w-4 h-4 text-[#E70013]" />
            Struk Penjualan
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Simulated 58mm Thermal Paper Card */}
        <div className="bg-slate-50 text-slate-900 font-mono text-xs p-4 rounded-xl shadow-inner border border-slate-300 max-h-96 overflow-y-auto w-[260px] mx-auto leading-tight">
          <ReceiptView transaction={transaction} vouchers={vouchers} />
        </div>

        {/* Printer Connection Status */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {printerStatus === 'connected' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : printerStatus === 'connecting' ? (
                <Loader2 className="w-4 h-4 text-[#E70013] animate-spin flex-shrink-0" />
              ) : printerStatus === 'unsupported' ? (
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              ) : (
                <Bluetooth className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-black text-slate-800 truncate">{printerStatusLabel()}</p>
                <p className="text-[10px] text-slate-500 font-semibold truncate">{printerStatusDetail()}</p>
              </div>
            </div>
            {printerStatus !== 'connected' && printerStatus !== 'unsupported' && (
              <button
                onClick={handleConnect}
                disabled={printerStatus === 'connecting'}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-[#E70013] text-white text-[10px] font-black uppercase tracking-wide transition-all shadow-sm cursor-pointer active:scale-95 disabled:opacity-60"
              >
                {printerStatus === 'connecting' ? 'Menghubung...' : 'Hubungkan'}
              </button>
            )}
          </div>
          {printerError && (
            <p className="text-[10px] font-bold text-[#E70013] leading-tight">{printerError}</p>
          )}
          {printMsg && (
            <p className="text-[10px] font-bold text-emerald-700 leading-tight">{printMsg}</p>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-[#E70013] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95 border border-[#E70013]"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Cetak Struk</span>
          </button>
        </div>
        {printerStatus === 'unsupported' && (
          <button
            onClick={handlePrintViaBrowser}
            className="w-full py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            Cetak via Browser (Preview)
          </button>
        )}
        {printerStatus === 'idle' && printerName && (
          <p className="text-center text-[10px] text-slate-400 font-semibold">
            Tidak ada printer Bluetooth?{' '}
            <button onClick={handlePrintViaBrowser} className="text-[#E70013] font-bold underline cursor-pointer">
              Cetak via browser
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

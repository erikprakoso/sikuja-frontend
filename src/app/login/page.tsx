'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifyPin, PIN_CONFIG } from '@/lib/services/auth';
import { KeyRound, ShieldCheck, AlertCircle, Delete, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        submitPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const submitPin = (pinToSubmit: string) => {
    const res = verifyPin(pinToSubmit);
    if (res.success && res.session) {
      // Redirect based on role
      switch (res.session.role) {
        case 'penjual':
          router.push('/penjualan');
          break;
        case 'pos':
          router.push('/checkin');
          break;
        case 'mc':
          router.push('/undian');
          break;
        case 'verifikator':
          router.push('/verifikasi');
          break;
        case 'admin':
          router.push('/admin');
          break;
        default:
          router.push('/');
      }
    } else {
      setError(res.error || 'PIN Salah');
      setPin('');
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center shadow-lg shadow-red-900/50">
          <Lock className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Login Peran Panitia</h1>
        <p className="text-xs text-slate-400">
          Masukkan 4-digit PIN khusus sesuai peran operasional Anda.
        </p>
      </div>

      {/* PIN Dots Indicator */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex justify-center items-center gap-4 py-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-5 h-5 rounded-full border-2 transition-all ${
                pin.length > idx
                  ? 'bg-red-500 border-red-400 scale-110 shadow-md shadow-red-500/50'
                  : 'bg-slate-950 border-slate-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs font-semibold flex items-center justify-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* 3x4 Keypad Grid */}
        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-xl font-bold text-white shadow-md transition-all border border-slate-700/50 flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-950 hover:bg-slate-900 active:scale-95 text-xs font-bold text-slate-400 transition-all border border-slate-800 flex items-center justify-center uppercase tracking-wider"
          >
            Reset
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-xl font-bold text-white shadow-md transition-all border border-slate-700/50 flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-red-950/60 hover:bg-red-900/80 active:scale-95 text-red-300 transition-all border border-red-800/60 flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* PIN Cheat Sheet Info Box */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
        <span className="font-bold text-slate-200 flex items-center gap-1.5">
          <KeyRound className="w-4 h-4 text-amber-400" />
          Panduan PIN Panitia:
        </span>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
            <span className="font-bold text-red-400 font-mono">1111</span>: Penjualan
          </div>
          <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
            <span className="font-bold text-emerald-400 font-mono">2222</span>: Pos Check-In
          </div>
          <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
            <span className="font-bold text-amber-400 font-mono">3333</span>: MC Undian
          </div>
          <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
            <span className="font-bold text-cyan-400 font-mono">4444</span>: Verifikasi
          </div>
          <div className="p-2 rounded bg-slate-950/60 border border-slate-800 col-span-2">
            <span className="font-bold text-purple-400 font-mono">9999</span>: Admin / Ketua
          </div>
        </div>
      </div>
    </div>
  );
}

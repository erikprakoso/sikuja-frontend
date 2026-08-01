'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { verifyPin, refreshSession } from '@/lib/services/auth';

import { LoginHeader } from '@/components/login/LoginHeader';
import { PinDotsIndicator } from '@/components/login/PinDotsIndicator';
import { PinKeypad } from '@/components/login/PinKeypad';
import { PinCheatSheet } from '@/components/login/PinCheatSheet';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [pinLength, setPinLength] = useState(6);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sudah login? Langsung lempar ke home (tidak boleh membuka /login dua kali).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await refreshSession();
        if (!cancelled && session) {
          router.replace('/');
        }
      } catch {
        // Offline: biarkan halaman login tampil.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Tanya server: 4 digit (bootstrap, tabel users kosong) atau 6 digit (normal).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/config');
        const data = await res.json();
        if (!cancelled && data?.pinLength) setPinLength(data.pinLength);
      } catch {
        // Offline: default 6 digit.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleKeyPress = (num: string) => {
    if (pin.length < pinLength && !isSubmitting) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError('');
      if (nextPin.length === pinLength) {
        submitPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (isSubmitting) return;
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    if (isSubmitting) return;
    setPin('');
    setError('');
  };

  const submitPin = async (pinToSubmit: string) => {
    setIsSubmitting(true);
    const res = await verifyPin(pinToSubmit);
    setIsSubmitting(false);

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
      {/* Header Title */}
      <LoginHeader pinLength={pinLength} />

      {/* PIN Dots & Keypad Box */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <PinDotsIndicator pinLength={pin.length} maxLength={pinLength} error={error} />
        <div className="relative">
          <PinKeypad
            onKeyPress={handleKeyPress}
            onClear={handleClear}
            onDelete={handleDelete}
          />
          {isSubmitting && (
            <div className="absolute inset-0 bg-white/85 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center gap-3 animate-fade-in">
              <Loader2 className="w-8 h-8 animate-spin text-[#E70013]" />
              <p className="text-xs font-bold text-slate-600">Memverifikasi PIN...</p>
            </div>
          )}
        </div>
      </div>

      {/* PIN Reference Cheat Sheet */}
      <PinCheatSheet />
    </div>
  );
}

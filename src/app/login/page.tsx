'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifyPin } from '@/lib/services/auth';

import { LoginHeader } from '@/components/login/LoginHeader';
import { PinDotsIndicator } from '@/components/login/PinDotsIndicator';
import { PinKeypad } from '@/components/login/PinKeypad';
import { PinCheatSheet } from '@/components/login/PinCheatSheet';

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
      {/* Header Title */}
      <LoginHeader />

      {/* PIN Dots & Keypad Box */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <PinDotsIndicator pinLength={pin.length} error={error} />
        <PinKeypad
          onKeyPress={handleKeyPress}
          onClear={handleClear}
          onDelete={handleDelete}
        />
      </div>

      {/* PIN Reference Cheat Sheet */}
      <PinCheatSheet />
    </div>
  );
}

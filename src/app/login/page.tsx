'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifyPin } from '@/lib/services/auth';

import { LoginHeader } from '@/components/login/LoginHeader';
import { PinDotsIndicator } from '@/components/login/PinDotsIndicator';
import { PinKeypad } from '@/components/login/PinKeypad';
import { PinCheatSheet } from '@/components/login/PinCheatSheet';

const PIN_LENGTH = 6;

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleKeyPress = (num: string) => {
    if (pin.length < PIN_LENGTH && !isSubmitting) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError('');
      if (nextPin.length === PIN_LENGTH) {
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
      <LoginHeader />

      {/* PIN Dots & Keypad Box */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <PinDotsIndicator pinLength={pin.length} maxLength={PIN_LENGTH} error={error} />
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

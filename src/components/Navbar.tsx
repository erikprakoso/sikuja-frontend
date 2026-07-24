'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getCurrentSession, logoutSession } from '@/lib/services/auth';
import { soundManager } from '@/lib/services/audio';
import { UserSession } from '@/types';
import {
  Sparkles,
  Ticket,
  QrCode,
  Trophy,
  CheckCircle2,
  ShieldAlert,
  Volume2,
  VolumeX,
  LogOut,
  Wifi,
  WifiOff,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setSession(getCurrentSession());

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pathname]);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.setMuted(next);
  };

  const handleLogout = () => {
    logoutSession();
    setSession(null);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-red-900/40 text-slate-100 shadow-lg no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center shadow-md shadow-red-900/50 group-hover:scale-105 transition-transform">
              <span className="text-xl font-black text-white tracking-tighter">SK</span>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl bg-gradient-to-r from-red-400 via-white to-red-300 bg-clip-text text-transparent tracking-wide">
                  SIKUJA
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-red-950 border border-red-700/60 text-red-300 tracking-wider">
                  Agustusan 🇮🇩
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                Sistem Kupon & Undian Jalan Sehat
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/penjualan"
              className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                pathname.startsWith('/penjualan')
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Ticket className="w-4 h-4" />
              Penjualan
            </Link>

            <Link
              href="/checkin"
              className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                pathname.startsWith('/checkin')
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <QrCode className="w-4 h-4" />
              Pos Check-In
            </Link>

            <Link
              href="/undian"
              className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                pathname.startsWith('/undian')
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                  : 'text-amber-300 hover:bg-slate-800'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Layar Undian
            </Link>

            <Link
              href="/verifikasi"
              className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                pathname.startsWith('/verifikasi')
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Verifikasi
            </Link>

            <Link
              href="/admin"
              className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                pathname.startsWith('/admin')
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Admin
            </Link>
          </nav>

          {/* Right Status Controls */}
          <div className="flex items-center gap-2">
            {/* Online / Offline status indicator */}
            <div
              title={isOnline ? 'Terhubung ke server' : 'Mode Offline Queue Aktif'}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
                isOnline
                  ? 'bg-emerald-950/80 border-emerald-700/50 text-emerald-300'
                  : 'bg-amber-950/80 border-amber-700/50 text-amber-300 animate-pulse'
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline Mode'}</span>
            </div>

            {/* Sound Toggle Button */}
            <button
              onClick={toggleSound}
              title={isMuted ? 'Aktifkan Suara Effect' : 'Mute Suara Effect'}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Session Info / Login */}
            {session ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <span className="px-2.5 py-1 rounded-md bg-red-900/60 border border-red-700 text-red-200 text-xs font-bold capitalize hidden sm:inline">
                  {session.name}
                </span>
                <button
                  onClick={handleLogout}
                  title="Keluar Session"
                  className="p-2 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-extrabold hover:from-red-500 hover:to-red-600 shadow-md shadow-red-900/40 transition-all"
              >
                Login PIN
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-800 py-2 text-xs">
          <Link
            href="/penjualan"
            className={`flex flex-col items-center gap-1 ${
              pathname.startsWith('/penjualan') ? 'text-red-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Ticket className="w-4 h-4" />
            Penjualan
          </Link>
          <Link
            href="/checkin"
            className={`flex flex-col items-center gap-1 ${
              pathname.startsWith('/checkin') ? 'text-red-400 font-bold' : 'text-slate-400'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Pos
          </Link>
          <Link
            href="/undian"
            className={`flex flex-col items-center gap-1 ${
              pathname.startsWith('/undian') ? 'text-amber-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Undian
          </Link>
          <Link
            href="/verifikasi"
            className={`flex flex-col items-center gap-1 ${
              pathname.startsWith('/verifikasi') ? 'text-red-400 font-bold' : 'text-slate-400'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Klaim
          </Link>
          <Link
            href="/admin"
            className={`flex flex-col items-center gap-1 ${
              pathname.startsWith('/admin') ? 'text-red-400 font-bold' : 'text-slate-400'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}

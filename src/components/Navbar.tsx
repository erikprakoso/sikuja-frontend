'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getCurrentSession, logoutSession } from '@/lib/services/auth';
import { soundManager } from '@/lib/services/audio';
import { UserSession } from '@/types';
import {
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

const NAV_ITEMS = [
  { href: '/penjualan', label: 'Penjualan', icon: Ticket, roles: ['penjual', 'admin'] },
  { href: '/checkin', label: 'Pos Check-In', icon: QrCode, roles: ['pos', 'admin'] },
  { href: '/undian', label: 'Layar Undian', icon: Trophy, roles: ['mc', 'admin'] },
  { href: '/verifikasi', label: 'Verifikasi', icon: CheckCircle2, roles: ['verifikator', 'admin'] },
  { href: '/admin', label: 'Admin', icon: ShieldAlert, roles: ['admin'] },
];

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

  if (pathname === '/undian' || pathname.startsWith('/v/')) {
    return null;
  }

  const visibleNavItems = session
    ? NAV_ITEMS.filter((item) => item.roles.includes(session.role))
    : [];

  return (
    <header className="sticky top-0 z-50 bg-white border-b-4 border-[#E70013] text-[#E70013] shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-[#E70013] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <span className="text-xl font-black text-white tracking-tighter">SK</span>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-black text-xl text-[#E70013] tracking-wide">
                  SIKUJA
                </span>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-[#E70013] text-white tracking-wider">
                  Agustusan 🇮🇩
                </span>
              </div>
              <span className="text-[11px] text-[#E70013] font-bold hidden sm:inline">
                Sistem Kupon & Undian Jalan Sehat
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {visibleNavItems.length > 0 && (
            <nav className="hidden md:flex items-center gap-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-xl text-sm font-black flex items-center gap-2 transition-all ${
                      isActive
                        ? 'bg-[#E70013] text-white shadow-md'
                        : 'text-[#E70013] hover:bg-[#E70013] hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Status Controls */}
          <div className="flex items-center gap-2">
            {/* Online / Offline status */}
            <div
              title={isOnline ? 'Terhubung ke server' : 'Mode Offline Queue Aktif'}
              className="px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1.5 border-2 border-[#E70013] bg-white text-[#E70013]"
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline Mode'}</span>
            </div>

            {/* Sound Toggle Button */}
            <button
              onClick={toggleSound}
              title={isMuted ? 'Aktifkan Suara Effect' : 'Mute Suara Effect'}
              className="p-2 rounded-xl bg-[#E70013] text-white hover:opacity-90 transition-all cursor-pointer active:scale-95 shadow"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Session Info / Login */}
            {session ? (
              <div className="flex items-center gap-2 pl-2 border-l-2 border-[#E70013]">
                <span className="px-2.5 py-1 rounded-lg bg-[#E70013] text-white text-xs font-black capitalize hidden sm:inline shadow">
                  {session.name}
                </span>
                <button
                  onClick={handleLogout}
                  title="Keluar Session"
                  className="p-2 rounded-xl bg-white border-2 border-[#E70013] text-[#E70013] hover:bg-[#E70013] hover:text-white transition-all flex items-center gap-1 text-xs font-black cursor-pointer active:scale-95 shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl bg-[#E70013] text-white text-xs font-black hover:bg-[#E70013]/90 shadow-md transition-all active:scale-95"
              >
                Login PIN
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        {visibleNavItems.length > 0 && (
          <div className="md:hidden flex items-center justify-around border-t-2 border-[#E70013] py-2 text-xs font-black">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 p-1.5 rounded-lg ${
                    isActive
                      ? 'bg-[#E70013] text-white'
                      : 'text-[#E70013]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}

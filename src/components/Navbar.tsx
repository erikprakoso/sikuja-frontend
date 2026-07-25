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
  ShieldCheck,
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
  { href: '/admin', label: 'Admin', icon: ShieldCheck, roles: ['admin'] },
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
    <header className="sticky top-0 z-50 bg-white border-b border-[#E70013]/20 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#E70013] flex items-center justify-center text-white text-sm font-black group-hover:opacity-90 transition-opacity">
              SK
            </div>
            <span className="font-black text-base text-[#E70013] tracking-tight">
              SIKUJA <span className="font-bold text-[#E70013]/60 text-sm">2026</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          {visibleNavItems.length > 0 && (
            <nav className="hidden md:flex items-center gap-0.5">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#E70013] text-white'
                        : 'text-[#E70013]/70 hover:text-[#E70013] hover:bg-[#E70013]/8'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Controls */}
          <div className="flex items-center gap-1.5">
            {/* Online Status */}
            <span
              title={isOnline ? 'Terhubung ke server' : 'Mode Offline Aktif'}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#E70013]/70 rounded-lg hover:bg-[#E70013]/8 transition-colors"
            >
              {isOnline
                ? <Wifi className="w-3.5 h-3.5 text-[#E70013]" />
                : <WifiOff className="w-3.5 h-3.5 text-[#E70013]" />
              }
              {isOnline ? 'Online' : 'Offline'}
            </span>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              title={isMuted ? 'Aktifkan Suara' : 'Mute Suara'}
              className="p-2 rounded-lg text-[#E70013]/70 hover:text-[#E70013] hover:bg-[#E70013]/8 transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-[#E70013]/20 mx-1" />

            {/* Session / Login */}
            {session ? (
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:block text-sm font-semibold text-[#E70013] capitalize px-2">
                  {session.name}
                </span>
                <button
                  onClick={handleLogout}
                  title="Keluar"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-[#E70013] hover:bg-[#E70013]/90 transition-colors cursor-pointer active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-[#E70013] hover:bg-[#E70013]/90 transition-colors active:scale-95"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        {visibleNavItems.length > 0 && (
          <div className="md:hidden flex items-center border-t border-[#E70013]/15 py-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-lg transition-all ${
                    isActive
                      ? 'text-[#E70013]'
                      : 'text-[#E70013]/40 hover:text-[#E70013]/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                  <span className={`text-[10px] ${isActive ? 'font-black' : 'font-medium'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="w-4 h-0.5 bg-[#E70013] rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}

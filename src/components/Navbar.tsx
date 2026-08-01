'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getCurrentSession, logoutSession, refreshSession } from '@/lib/services/auth';
import { soundManager } from '@/lib/services/audio';
import { UserSession } from '@/types';
import {
  Volume2,
  VolumeX,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/penjualan', label: 'Penjualan', roles: ['penjual', 'admin'] },
  { href: '/checkin', label: 'Pos Check-In', roles: ['pos', 'admin'] },
  { href: '/undian', label: 'Layar Undian', roles: ['mc', 'admin'] },
  { href: '/verifikasi', label: 'Verifikasi', roles: ['verifikator', 'admin'] },
  { href: '/admin', label: 'Admin', roles: ['admin'] },
  { href: '/admin/users', label: 'Petugas', roles: ['admin'] },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(() => getCurrentSession());
  const [isMuted, setIsMuted] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    () => typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Akses login tersembunyi: ketuk logo 5x cepat → /login.
  const [brandTaps, setBrandTaps] = useState(0);
  const brandTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBrandClick = (e: React.MouseEvent) => {
    const next = brandTaps + 1;
    setBrandTaps(next);
    if (brandTapTimer.current) clearTimeout(brandTapTimer.current);
    brandTapTimer.current = setTimeout(() => setBrandTaps(0), 2000);

    if (next >= 5) {
      e.preventDefault();
      setBrandTaps(0);
      router.push('/login');
    }
  };

  useEffect(() => {
    return () => {
      if (brandTapTimer.current) clearTimeout(brandTapTimer.current);
    };
  }, []);

  useEffect(() => {
    refreshSession().then((s) => {
      if (s) setSession(s);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== 'undefined') {
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

  const handleLogout = async () => {
    await logoutSession();
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
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 no-print transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Brand Logo (ketuk 5x untuk akses login panitia) */}
          <Link href="/" onClick={handleBrandClick} className="flex items-center gap-2.5 group">
            <img
              src="/logo-ri.png"
              alt="Logo 81 Tahun RI"
              className="h-8 w-auto object-contain group-hover:scale-105 transition-transform"
            />
            <span className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-1">
              Jalan Sehat <span className="text-[#E70013]">2026</span>
            </span>
          </Link>

          {/* Desktop Clean Navigation */}
          {visibleNavItems.length > 0 && (
            <nav className="hidden md:flex items-center gap-1">
              {visibleNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3.5 py-1.5 text-sm font-semibold transition-all relative ${
                      isActive
                        ? 'text-slate-900 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-[#E70013] rounded-full animate-fade-in" />
                    )}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Online Status Badge */}
            <span
              title={isOnline ? 'Terhubung ke server' : 'Mode Offline Aktif'}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-500 bg-slate-100 rounded-full border border-slate-200/60"
            >
              {isOnline ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Offline
                </>
              )}
            </span>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              title={isMuted ? 'Aktifkan Suara' : 'Mute Suara'}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Divider */}
            <div className="w-px h-4 bg-slate-200 mx-0.5" />

            {/* User Session (login tidak ditampilkan ke publik) */}
            {session && (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60">
                  <UserIcon className="w-3 h-3 text-slate-500" />
                  <span className="capitalize">{session.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Keluar"
                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Clean Nav Bar */}
        {visibleNavItems.length > 0 && (
          <div className="md:hidden flex items-center justify-around border-t border-slate-100 py-1.5">
            {visibleNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1 text-xs transition-all relative ${
                    isActive
                      ? 'text-slate-900 font-extrabold'
                      : 'text-slate-500 font-medium hover:text-slate-800'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="block w-full h-0.5 bg-[#E70013] rounded-full mt-0.5" />
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

'use client';

import { usePathname } from 'next/navigation';

export function AppFooter() {
  const pathname = usePathname();
  // Sembunyikan footer di stage undian outdoor agar hitam full-bleed
  if (pathname === '/draw' || pathname === '/undian' || pathname.startsWith('/v/')) {
    return null;
  }
  return (
    <footer className="border-t border-slate-100 py-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs text-slate-400">
        <p className="font-semibold text-slate-500">Jalan Sehat 2026</p>
        <p>Aplikasi undian digital &middot; Transparan &middot; Realtime</p>
      </div>
    </footer>
  );
}

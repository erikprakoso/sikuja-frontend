import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import './globals.css';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SIKUJA — Sistem Kupon & Undian Jalan Sehat Agustusan',
  description: 'Aplikasi Digital Penjualan Kupon, Check-in Pos, dan Pengocokan Undian Agustusan Transparan & Realtime.',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#dc2626',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${outfit.variable} ${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-red-600 selection:text-white">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© 2026 SIKUJA — Sistem Kupon & Undian Jalan Sehat Agustusan 🇮🇩</p>
            <p className="text-slate-600">Aplikasi Web PWA • Bebas Kecurangan • Transparan</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

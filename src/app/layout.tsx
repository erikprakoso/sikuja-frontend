import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import { SyncProvider } from '@/components/SyncProvider';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
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
  themeColor: '#E70013',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${outfit.variable} ${inter.variable} h-full antialiased light`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900 font-sans selection:bg-[#E70013] selection:text-white">
        <Navbar />
        <SyncProvider>
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </SyncProvider>
        <PwaInstallPrompt />
        <footer className="border-t border-[#E70013]/20 bg-white py-6 text-center text-xs text-slate-600 font-medium">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© 2026 SIKUJA — Sistem Kupon & Undian Jalan Sehat Agustusan 🇮🇩</p>
            <p className="text-slate-500 font-semibold">Aplikasi Web PWA • Bebas Kecurangan • Transparan</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

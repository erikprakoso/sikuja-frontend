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
  title: 'Jalan Sehat 2026',
  description: 'Aplikasi Digital Penjualan Kupon, Check-in Pos, dan Pengocokan Undian Agustusan Transparan & Realtime.',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo-ri.png',
    shortcut: '/logo-ri.png',
    apple: '/logo-ri.png',
  },
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
        <footer className="border-t border-slate-100 py-5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs text-slate-400">
            <p className="font-semibold text-slate-500">Jalan Sehat 2026</p>
            <p>Aplikasi undian digital &middot; Transparan &middot; Realtime</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

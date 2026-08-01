import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-[#E70013] text-white flex items-center justify-center shadow-md">
        <FileQuestion className="w-10 h-10" />
      </div>
      <div className="space-y-1.5">
        <p className="text-6xl font-black text-slate-900 tracking-tight">404</p>
        <h1 className="text-lg font-black text-slate-900">Halaman Tidak Ditemukan</h1>
        <p className="text-sm text-slate-600 font-medium max-w-sm mx-auto">
          Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#E70013] hover:bg-[#c90612] shadow-sm transition-all cursor-pointer active:scale-95"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}

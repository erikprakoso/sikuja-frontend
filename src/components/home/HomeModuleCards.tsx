import React from 'react';
import Link from 'next/link';
import { UserSession } from '@/types';
import {
  Ticket,
  QrCode,
  Trophy,
  CheckCircle2,
  ShieldCheck,
  Users,
  ArrowRight,
  LucideIcon,
} from 'lucide-react';

interface ModuleCardItem {
  href: string;
  title: string;
  desc: string;
  roles: string[];
  pinText: string;
  icon: LucideIcon;
}

export const MODULE_CARDS: ModuleCardItem[] = [
  {
    href: '/penjualan',
    title: '1. Transaksi Penjualan',
    desc: 'Penerbitan kupon fisik dan E-Voucher digital dengan dukungan struk pembayaran kasir.',
    roles: ['penjual', 'admin'],
    pinText: 'Akses Kasir',
    icon: Ticket,
  },
  {
    href: '/checkin',
    title: '2. Pos Validasi Check-In',
    desc: 'Pemindaian QR Code dan verifikasi kode kupon peserta di pos pemeriksaan rute.',
    roles: ['pos', 'admin'],
    pinText: 'Akses Petugas Pos',
    icon: QrCode,
  },
  {
    href: '/undian',
    title: '3. Panggung Pengundian',
    desc: 'Tampilan pengundian doorprize layar penuh untuk panggung utama event.',
    roles: ['mc', 'admin'],
    pinText: 'Akses Operator Panggung',
    icon: Trophy,
  },
  {
    href: '/verifikasi',
    title: '4. Verifikasi Hadiah',
    desc: 'Validasi klaim hadiah pemenang dan konfirmasi serah terima doorprize.',
    roles: ['verifikator', 'admin'],
    pinText: 'Akses Petugas Verifikasi',
    icon: CheckCircle2,
  },
  {
    href: '/admin',
    title: '5. Panel Administrasi',
    desc: 'Manajemen kategori doorprize, rekapitulasi laporan penjualan, dan sinkronisasi data.',
    roles: ['admin'],
    pinText: 'Akses Administrator',
    icon: ShieldCheck,
  },
];

interface HomeModuleCardsProps {
  session: UserSession;
}

export const HomeModuleCards: React.FC<HomeModuleCardsProps> = ({ session }) => {
  const visibleCards = MODULE_CARDS.filter((card) => card.roles.includes(session.role));

  if (visibleCards.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-[#E70013] flex items-center gap-2">
          <Users className="w-5 h-5 text-[#E70013]" />
          Menu Operasional Petugas ({session.name})
        </h2>
        <span className="text-xs text-[#E70013] font-bold">Peran Akses: {session.role.toUpperCase()}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {visibleCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group relative bg-white border-4 border-[#E70013] hover:bg-[#E70013] rounded-2xl p-5 transition-all shadow-md cursor-pointer active:scale-[0.98] flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#E70013] text-white group-hover:bg-white group-hover:text-[#E70013] flex items-center justify-center transition-colors shadow-md">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-[#E70013] group-hover:text-white transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-[#E70013] group-hover:text-white leading-relaxed font-semibold transition-colors">
                  {card.desc}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t-2 border-[#E70013] group-hover:border-white flex items-center justify-between text-xs font-black text-[#E70013] group-hover:text-white transition-colors">
                <span>{card.pinText}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

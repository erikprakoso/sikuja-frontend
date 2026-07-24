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
  borderColor: string;
  shadowColor: string;
  iconBg: string;
  textColor: string;
}

export const MODULE_CARDS: ModuleCardItem[] = [
  {
    href: '/penjualan',
    title: '1. Transaksi Penjualan',
    desc: 'Penerbitan kupon fisik dan E-Voucher digital dengan dukungan struk pembayaran kasir.',
    roles: ['penjual', 'admin'],
    pinText: 'Akses Kasir',
    icon: Ticket,
    borderColor: 'hover:border-red-600/60',
    shadowColor: 'hover:shadow-red-950/40',
    iconBg: 'bg-red-950 border-red-800/80 text-red-400',
    textColor: 'text-red-400',
  },
  {
    href: '/checkin',
    title: '2. Pos Validasi Check-In',
    desc: 'Pemindaian QR Code dan verifikasi kode kupon peserta di pos pemeriksaan rute.',
    roles: ['pos', 'admin'],
    pinText: 'Akses Petugas Pos',
    icon: QrCode,
    borderColor: 'hover:border-emerald-600/60',
    shadowColor: 'hover:shadow-emerald-950/40',
    iconBg: 'bg-emerald-950 border-emerald-800/80 text-emerald-400',
    textColor: 'text-emerald-400',
  },
  {
    href: '/undian',
    title: '3. Panggung Pengundian',
    desc: 'Tampilan pengundian doorprize layar penuh untuk panggung utama event.',
    roles: ['mc', 'admin'],
    pinText: 'Akses Operator Panggung',
    icon: Trophy,
    borderColor: 'hover:border-amber-500/60',
    shadowColor: 'hover:shadow-amber-950/40',
    iconBg: 'bg-amber-950 border-amber-800/80 text-amber-400',
    textColor: 'text-amber-400',
  },
  {
    href: '/verifikasi',
    title: '4. Verifikasi Hadiah',
    desc: 'Validasi klaim hadiah pemenang dan konfirmasi serah terima doorprize.',
    roles: ['verifikator', 'admin'],
    pinText: 'Akses Petugas Verifikasi',
    icon: CheckCircle2,
    borderColor: 'hover:border-cyan-500/60',
    shadowColor: 'hover:shadow-cyan-950/40',
    iconBg: 'bg-cyan-950 border-cyan-800/80 text-cyan-400',
    textColor: 'text-cyan-400',
  },
  {
    href: '/admin',
    title: '5. Panel Administrasi',
    desc: 'Manajemen kategori doorprize, rekapitulasi laporan penjualan, dan sinkronisasi data.',
    roles: ['admin'],
    pinText: 'Akses Administrator',
    icon: ShieldCheck,
    borderColor: 'hover:border-purple-500/60',
    shadowColor: 'hover:shadow-purple-950/40',
    iconBg: 'bg-purple-950 border-purple-800/80 text-purple-400',
    textColor: 'text-purple-400',
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
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-red-500" />
          Menu Operasional Petugas ({session.name})
        </h2>
        <span className="text-xs text-slate-400">Peran Akses: {session.role.toUpperCase()}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {visibleCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className={`group relative bg-slate-900/80 border border-slate-800 ${card.borderColor} rounded-2xl p-5 transition-all hover:shadow-xl ${card.shadowColor} flex flex-col justify-between`}
            >
              <div className="space-y-3">
                <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {card.desc}
                </p>
              </div>
              <div className={`mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold ${card.textColor}`}>
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

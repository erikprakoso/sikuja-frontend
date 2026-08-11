'use client';

import React from 'react';
import { isWhatsAppConfigured, getWhatsAppOrderUrl } from '@/lib/services/whatsapp';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

export const WhatsAppFloatButton: React.FC = () => {
  const waUrl = getWhatsAppOrderUrl();
  const hasWhatsApp = isWhatsAppConfigured();

  if (!hasWhatsApp) return null;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Pesan Kupon via WhatsApp"
      className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xl hover:bg-[#1ebe57] hover:scale-105 hover:shadow-2xl transition-all cursor-pointer active:scale-95"
    >
      <WhatsAppIcon className="w-7 h-7" />
    </a>
  );
};

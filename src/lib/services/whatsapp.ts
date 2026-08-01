const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';

const DEFAULT_MESSAGE =
  'Halo, saya mau pesan E-Voucher Jalan Sehat 2026. Mohon info cara pemesanannya.';

export const isWhatsAppConfigured = (): boolean => Boolean(WHATSAPP_NUMBER);

export function getWhatsAppOrderUrl(message: string = DEFAULT_MESSAGE): string {
  if (!WHATSAPP_NUMBER) return '';
  const digits = WHATSAPP_NUMBER.replace(/\D/g, '');
  if (!digits) return '';
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

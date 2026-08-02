import { Transaction, Voucher } from '@/types';
import { getAppBaseUrl } from '@/lib/storage';

export const RECEIPT_LINE_WIDTH = 32;

export interface ReceiptTextRow {
  type: 'text';
  align?: 'left' | 'center';
  bold?: boolean;
  double?: boolean;
  text: string;
}

export interface ReceiptLineRow {
  type: 'line';
  left: string;
  right?: string;
  bold?: boolean;
  double?: boolean;
  variant?: 'meta' | 'item' | 'total' | 'coupon';
}

export interface ReceiptDashedRow {
  type: 'dashed';
}

export interface ReceiptQrRow {
  type: 'qr';
  text: string;
}

export interface ReceiptSpacerRow {
  type: 'spacer';
}

export type ReceiptRow =
  | ReceiptTextRow
  | ReceiptLineRow
  | ReceiptDashedRow
  | ReceiptQrRow
  | ReceiptSpacerRow;

const EVENT_HEADER = 'PANITIA JALAN SEHAT';
const EVENT_SUB = 'SIKUJA 2026';
const EVENT_TAGLINE = process.env.NEXT_PUBLIC_EVENT_TAGLINE || 'Jalan Sehat, Doorprize & UMKM';
const EVENT_DATE = process.env.NEXT_PUBLIC_EVENT_DATE || '';

function fmtIdr(n: number): string {
  return n.toLocaleString('id-ID');
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  const time = `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`;
  return `${date} ${time}`;
}

export function buildReceiptModel(transaction: Transaction, vouchers: Voucher[]): ReceiptRow[] {
  const rows: ReceiptRow[] = [];

  const totalQty = transaction.qty_fisik + transaction.qty_non_fisik;
  const unitPrice = totalQty > 0 ? Math.round(transaction.total_harga / totalQty) : 0;

  // ── Header ──
  rows.push({ type: 'text', align: 'center', bold: true, double: true, text: EVENT_HEADER });
  rows.push({ type: 'text', align: 'center', bold: true, text: EVENT_SUB });
  if (EVENT_TAGLINE) rows.push({ type: 'text', align: 'center', text: EVENT_TAGLINE });
  if (EVENT_DATE) rows.push({ type: 'text', align: 'center', text: EVENT_DATE });
  rows.push({ type: 'dashed' });

  // ── Meta transaksi ──
  rows.push({
    type: 'line',
    variant: 'meta',
    left: 'No. Struk',
    right: `SIK-${transaction.id.slice(-8).toUpperCase()}`,
  });
  rows.push({ type: 'line', variant: 'meta', left: 'Tanggal', right: fmtDateTime(transaction.created_at) });
  if (transaction.created_by) {
    rows.push({ type: 'line', variant: 'meta', left: 'Kasir', right: transaction.created_by });
  }
  rows.push({ type: 'dashed' });

  // ── Pemilik kupon ──
  if (transaction.customer_name) {
    rows.push({ type: 'text', align: 'center', bold: true, text: 'PEMILIK KUPON' });
    rows.push({ type: 'text', align: 'center', text: transaction.customer_name });
    if (transaction.customer_phone) {
      rows.push({ type: 'text', align: 'center', text: `HP: ${transaction.customer_phone}` });
    }
    rows.push({ type: 'dashed' });
  }

  // ── Rincian pembelian ──
  if (transaction.qty_fisik > 0) {
    rows.push({
      type: 'line',
      variant: 'item',
      left: `Kupon Fisik (${transaction.qty_fisik})`,
      right: `Rp ${fmtIdr(transaction.qty_fisik * unitPrice)}`,
    });
  }
  if (transaction.qty_non_fisik > 0) {
    rows.push({
      type: 'line',
      variant: 'item',
      left: `E-Voucher Digital (${transaction.qty_non_fisik})`,
      right: `Rp ${fmtIdr(transaction.qty_non_fisik * unitPrice)}`,
    });
  }
  rows.push({
    type: 'line',
    variant: 'total',
    left: 'TOTAL',
    right: `Rp ${fmtIdr(transaction.total_harga)}`,
    bold: true,
    double: true,
  });
  rows.push({ type: 'dashed' });

  // ── QR check-in (berlaku untuk semua transaksi) ──
  rows.push({ type: 'text', align: 'center', bold: true, text: 'QR CHECK-IN' });
  rows.push({ type: 'qr', text: `${getAppBaseUrl()}/v/${transaction.token}` });
  rows.push({ type: 'text', align: 'center', text: 'Pindai QR saat check-in di loket' });
  rows.push({ type: 'dashed' });

  // ── Kode kupon fisik ──
  const physicalVouchers = vouchers.filter((v) => v.type === 'fisik');
  if (physicalVouchers.length > 0) {
    rows.push({
      type: 'text',
      align: 'center',
      bold: true,
      text: `KODE KUPON FISIK (${physicalVouchers.length} LBR)`,
    });
    physicalVouchers.forEach((v, idx) => {
      rows.push({ type: 'line', variant: 'coupon', left: `#${idx + 1}`, right: v.code });
    });
    rows.push({ type: 'dashed' });
  }

  // ── Footer syarat ──
  rows.push({ type: 'text', align: 'center', text: '* Kupon hanya berlaku pada acara' });
  rows.push({ type: 'text', align: 'center', text: 'Jalan Sehat 2026. Simpan struk ini.' });
  rows.push({ type: 'spacer' });
  rows.push({ type: 'text', align: 'center', bold: true, text: 'Terima Kasih!' });

  return rows;
}

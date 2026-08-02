import { Transaction, Voucher } from '@/types';

const SPP_SERVICE = '49535343-fe7d-4ae5-8fa9-9fafd205e455';
const SPP_WRITE_CHAR = '49535343-8841-43f4-a8d4-ecbe34729bb3';

const SERVICES: BluetoothServiceUUID[] = [
  SPP_SERVICE,
  0xff00,
  0xffe0,
  0xfff0,
  0x1823,
];

const PRINTER_ID_KEY = 'sikuja_printer_id';
const PRINTER_NAME_KEY = 'sikuja_printer_name';

const LINE_WIDTH = 32;

let writeChar: BluetoothRemoteGATTCharacteristic | null = null;
let disconnectHandler: (() => void) | null = null;

export function isBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.bluetooth;
}

export function onPrinterDisconnect(cb: (() => void) | null): void {
  disconnectHandler = cb;
}

export function isPrinterConnected(): boolean {
  return !!writeChar;
}

export function getPrinterLastConnectedName(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(PRINTER_NAME_KEY);
}

export function getPrinterLastConnectedId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(PRINTER_ID_KEY);
}

function toEscPosChars(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[•·]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[…]/g, '...');
}

function encode(text: string): number[] {
  const bytes: number[] = [];
  for (const ch of toEscPosChars(text)) {
    const cp = ch.codePointAt(0) ?? 0;
    bytes.push(cp <= 0xff ? cp : 0x20);
  }
  return bytes;
}

const ESC = {
  INIT: [0x1b, 0x40],
  CENTER: [0x1b, 0x61, 0x01],
  LEFT: [0x1b, 0x61, 0x00],
  BOLD_ON: [0x1b, 0x45, 0x01],
  BOLD_OFF: [0x1b, 0x45, 0x00],
  SIZE_NORMAL: [0x1d, 0x21, 0x00],
  SIZE_DOUBLE: [0x1d, 0x21, 0x11],
  LF: [0x0a],
  FEED: (n: number) => [0x1b, 0x64, n],
  CUT: [0x1d, 0x56, 0x00],
};

function emitLine(
  out: number[],
  content: string,
  opts: { align?: 'center' | 'left'; bold?: boolean; double?: boolean } = {}
): void {
  const { align = 'left', bold = false, double = false } = opts;
  out.push(...(align === 'center' ? ESC.CENTER : ESC.LEFT));
  if (bold) out.push(...ESC.BOLD_ON);
  if (double) out.push(...ESC.SIZE_DOUBLE);

  const width = double ? Math.floor(LINE_WIDTH / 2) : LINE_WIDTH;
  const padded = toEscPosChars(content).slice(0, width).padEnd(width, ' ');
  out.push(...encode(padded));

  if (double) out.push(...ESC.SIZE_NORMAL);
  if (bold) out.push(...ESC.BOLD_OFF);
  out.push(...ESC.LF);
}

function emitQr(out: number[], qrText: string): void {
  out.push(...[0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]); // model 2
  out.push(...[0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x06]); // module size 6
  out.push(...[0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x48]); // ECC level H
  const data = encode(qrText);
  const len = data.length + 2;
  out.push(0x1d, 0x28, 0x6b, len & 0xff, (len >> 8) & 0xff, 0x31, 0x50, ...data); // store
  out.push(...[0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]); // print
  out.push(...ESC.LF);
}

export function buildReceiptBytes(
  transaction: Transaction,
  vouchers: Voucher[],
  qrText: string
): Uint8Array<ArrayBuffer> {
  const physicalVouchers = vouchers.filter((v) => v.type === 'fisik');
  const totalLembar = transaction.qty_fisik + transaction.qty_non_fisik;
  const time = new Date(transaction.created_at).toLocaleTimeString('id-ID');

  const out: number[] = [];
  out.push(...ESC.INIT);

  emitLine(out, 'PANITIA JALAN SEHAT', { align: 'center', bold: true, double: true });
  emitLine(out, 'SIKUJA 2026', { align: 'center', bold: true });
  out.push(...ESC.LF);

  if (transaction.customer_name) {
    emitLine(out, `Pemilik: ${transaction.customer_name}`, { align: 'center' });
  }
  if (transaction.customer_phone) {
    emitLine(out, transaction.customer_phone, { align: 'center' });
  }
  emitLine(out, `Tx: ${transaction.id.slice(-8)} - ${time}`, { align: 'center' });
  emitLine(out, '-'.repeat(LINE_WIDTH), { align: 'center' });

  emitLine(out, 'QR CODE E-VOUCHER', { align: 'center', bold: true });
  emitQr(out, qrText);
  emitLine(out, 'Pindaikan QR Code untuk', { align: 'center' });
  emitLine(out, 'Check-in', { align: 'center' });
  out.push(...ESC.LF);

  if (physicalVouchers.length > 0) {
    emitLine(out, `KODE KUPON FISIK (${physicalVouchers.length} LBR)`, { align: 'center', bold: true });
    physicalVouchers.forEach((v, idx) => {
      const lineStr = `#Kupon ${idx + 1}  ${v.code}`;
      emitLine(out, lineStr, { align: 'center' });
    });
    out.push(...ESC.LF);
  }

  emitLine(out, `Total: ${totalLembar} Lbr - Rp ${transaction.total_harga.toLocaleString('id-ID')}`, {
    align: 'center',
    bold: true,
    double: true,
  });
  emitLine(out, 'Terima Kasih atas Partisipasi Anda', { align: 'center' });

  out.push(...ESC.FEED(4));
  out.push(...ESC.CUT);

  return new Uint8Array(out);
}

async function findWritableCharacteristic(
  service: BluetoothRemoteGATTService
): Promise<BluetoothRemoteGATTCharacteristic | null> {
  const chars = await service.getCharacteristics();
  for (const c of chars) {
    if (c.uuid === SPP_WRITE_CHAR) return c;
  }
  const writable = chars.filter((c) => c.properties.write || c.properties.writeWithoutResponse);
  return writable.length > 0 ? writable[0] : null;
}

async function openGatt(device: BluetoothDevice): Promise<boolean> {
  device.addEventListener('gattserverdisconnected', () => {
    writeChar = null;
    disconnectHandler?.();
  });

  let server: BluetoothRemoteGATTServer | undefined;
  try {
    server = await device.gatt?.connect();
  } catch {
    return false;
  }
  if (!server) return false;

  for (const svc of SERVICES) {
    try {
      const service = await server.getPrimaryService(svc);
      const char = await findWritableCharacteristic(service);
      if (char) {
        writeChar = char;
        return true;
      }
    } catch {
      // coba layanan berikutnya
    }
  }

  try {
    server.disconnect();
  } catch {
    // abaikan
  }
  return false;
}

export async function connectPrinter(): Promise<string> {
  if (!isBluetoothSupported()) {
    throw new Error('Browser ini tidak mendukung Web Bluetooth (butuh Chrome/Android).');
  }

  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: SERVICES,
  });

  const ok = await openGatt(device);
  if (!ok) {
    throw new Error(
      'Layanan printer tidak ditemukan di perangkat ini. Pastikan printer thermal Bluetooth menyala dan tidak dipakai aplikasi lain.'
    );
  }

  window.localStorage.setItem(PRINTER_ID_KEY, device.id);
  window.localStorage.setItem(PRINTER_NAME_KEY, device.name ?? 'Printer Thermal');
  return device.name ?? 'Printer Thermal';
}

export async function tryReconnectLastPrinter(): Promise<boolean> {
  if (!isBluetoothSupported()) return false;
  const bt = navigator.bluetooth as typeof navigator.bluetooth & {
    getDevices?: () => Promise<BluetoothDevice[]>;
  };
  if (typeof bt.getDevices !== 'function') return false;

  const lastId = getPrinterLastConnectedId();
  if (!lastId) return false;

  try {
    const devices = await bt.getDevices();
    const device = devices.find((d) => d.id === lastId);
    if (!device) return false;
    const ok = await openGatt(device);
    if (ok) return true;
  } catch {
    // abaikan, biarkan status idle
  }
  return false;
}

export function disconnectPrinter(): void {
  if (writeChar?.service.device.gatt?.connected) {
    writeChar.service.device.gatt.disconnect();
  }
  writeChar = null;
}

async function writeChunked(data: Uint8Array<ArrayBuffer>): Promise<void> {
  if (!writeChar) throw new Error('Printer belum terhubung.');

  const CHUNK = 20;
  for (let i = 0; i < data.length; i += CHUNK) {
    const len = Math.min(CHUNK, data.length - i);
    const chunk = new Uint8Array(data.buffer.slice(i, i + len));
    try {
      await writeChar.writeValueWithoutResponse(chunk);
    } catch {
      await writeChar.writeValue(chunk);
    }
    await new Promise((r) => setTimeout(r, 30));
  }
}

export async function printThermalReceipt(
  transaction: Transaction,
  vouchers: Voucher[],
  qrText: string
): Promise<void> {
  if (!isPrinterConnected()) throw new Error('Printer belum terhubung.');
  const data = buildReceiptBytes(transaction, vouchers, qrText);
  await writeChunked(data);
}

import QRCode from 'qrcode';
import { Transaction, Voucher } from '@/types';
import { buildReceiptModel, RECEIPT_LINE_WIDTH } from '@/lib/receipt';

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

const LOGO_URL = '/logo-ri.png';
const LOGO_WIDTH_DOTS = 128;
const LOGO_MAX_HEIGHT_DOTS = 64;
const LOGO_THRESHOLD = 128;

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
  SIZE_DOUBLE_H: [0x1d, 0x21, 0x10],
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
  if (double) out.push(...ESC.SIZE_DOUBLE_H);

  const padded = toEscPosChars(content).slice(0, RECEIPT_LINE_WIDTH).padEnd(RECEIPT_LINE_WIDTH, ' ');
  out.push(...encode(padded));

  if (double) out.push(...ESC.SIZE_NORMAL);
  if (bold) out.push(...ESC.BOLD_OFF);
  out.push(...ESC.LF);
}

function emitLineRow(
  out: number[],
  left: string,
  right: string,
  opts: { bold?: boolean; double?: boolean } = {}
): void {
  const pad = Math.max(1, RECEIPT_LINE_WIDTH - left.length - right.length);
  emitLine(out, left + ' '.repeat(pad) + right, { align: 'left', bold: opts.bold, double: opts.double });
}

/**
 * QR check-in dicetak sebagai raster bitmap (GS v 0) — BUKAN perintah QR
 * ESC/POS (GS ( k). Alasan:
 *  - Banyak printer thermal murah tidak mendukung / salah parse GS ( k,
 *    akibatnya URL tercetak sebagai teks dan QR yang terbentuk beda struktur.
 *  - Raster memakai library `qrcode` yang SAMA dengan tampilan di app, sehingga
 *    QR di kertas terjamin identik dengan QR di layar (matriks modulnya sama).
 */
const QR_MODULE_DOTS = 4;

function buildQrRasterBytes(qrText: string): number[] {
  const qr = QRCode.create(qrText, { errorCorrectionLevel: 'M' });
  const size = qr.modules.size;
  const data = qr.modules.data;

  const w = size * QR_MODULE_DOTS;
  const h = size * QR_MODULE_DOTS;
  const xBytes = Math.ceil(w / 8);
  const pixels: number[] = [];

  for (let y = 0; y < h; y++) {
    let byte = 0;
    let bit = 0;
    const srcY = Math.floor(y / QR_MODULE_DOTS);
    for (let x = 0; x < w; x++) {
      const on = data[srcY * size + Math.floor(x / QR_MODULE_DOTS)] === 1;
      if (on) byte |= 0x80 >> bit;
      bit++;
      if (bit === 8) {
        pixels.push(byte);
        byte = 0;
        bit = 0;
      }
    }
    if (bit > 0) pixels.push(byte);
  }

  return [
    0x1d, 0x76, 0x30, 0x00, // GS v 0 (raster bit image, normal)
    xBytes & 0xff,
    (xBytes >> 8) & 0xff,
    h & 0xff,
    (h >> 8) & 0xff,
    ...pixels,
  ];
}

/**
 * Muat logo /logo-ri.png, ubah jadi bitmap hitam-putih 1-bit, lalu susun
 * byte perintah raster ESC/POS `GS v 0` agar logo ikut tercetak di struk
 * thermal. Mengembalikan null jika logo gagal dimuat (struk tetap dicetak).
 */
async function loadRasterLogoBytes(): Promise<number[] | null> {
  try {
    const img = new Image();
    img.src = LOGO_URL;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const scale = Math.min(
      LOGO_WIDTH_DOTS / img.naturalWidth,
      LOGO_MAX_HEIGHT_DOTS / img.naturalHeight,
      1
    );
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Latar putih dulu (logo PNG bisa transparan), lalu gambar logo.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    const data = ctx.getImageData(0, 0, w, h).data;
    const xBytes = Math.ceil(w / 8);
    const pixels: number[] = [];

    for (let y = 0; y < h; y++) {
      let byte = 0;
      let bit = 0;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        // Piksel transparan dianggap putih; sisanya di-threshold luminance.
        const on = a < LOGO_THRESHOLD ? false : 0.299 * r + 0.587 * g + 0.114 * b < LOGO_THRESHOLD;
        if (on) byte |= 0x80 >> bit;
        bit++;
        if (bit === 8) {
          pixels.push(byte);
          byte = 0;
          bit = 0;
        }
      }
      if (bit > 0) pixels.push(byte);
    }

    return [
      0x1d, 0x76, 0x30, 0x00, // GS v 0 (raster bit image, normal)
      xBytes & 0xff,
      (xBytes >> 8) & 0xff,
      h & 0xff,
      (h >> 8) & 0xff,
      ...pixels,
    ];
  } catch {
    return null;
  }
}

export async function buildReceiptBytes(
  transaction: Transaction,
  vouchers: Voucher[]
): Promise<Uint8Array<ArrayBuffer>> {
  const model = buildReceiptModel(transaction, vouchers);

  const out: number[] = [];
  out.push(...ESC.INIT);

  // Logo di atas struk (hanya bila berhasil dimuat).
  const logo = await loadRasterLogoBytes();
  if (logo) {
    out.push(...logo);
    out.push(...ESC.LF);
  }

  for (const row of model) {
    switch (row.type) {
      case 'spacer':
        out.push(...ESC.LF);
        break;
      case 'dashed':
        emitLine(out, '-'.repeat(RECEIPT_LINE_WIDTH), { align: 'center' });
        break;
      case 'text':
        emitLine(out, row.text, { align: row.align, bold: row.bold, double: row.double });
        break;
      case 'line':
        emitLineRow(out, row.left, row.right ?? '', { bold: row.bold, double: row.double });
        break;
      case 'qr':
        try {
          out.push(...buildQrRasterBytes(row.text));
        } catch {
          // QR gagal dibuat — lewati, struk tetap dicetak.
        }
        out.push(...ESC.LF);
        break;
    }
  }

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
  vouchers: Voucher[]
): Promise<void> {
  if (!isPrinterConnected()) throw new Error('Printer belum terhubung.');
  const data = await buildReceiptBytes(transaction, vouchers);
  await writeChunked(data);
}

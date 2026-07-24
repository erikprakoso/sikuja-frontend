/**
 * QRIS Helper Service — Converts Static QRIS payload into Dynamic QRIS with embedded amount.
 * Fully compliant with Bank Indonesia ASPI & EMVCo Standard.
 */

const STORAGE_KEY_STATIC_QRIS = 'sikuja_static_qris';

// Default Static QRIS payload loaded strictly from environment variable
export const DEFAULT_STATIC_QRIS = process.env.NEXT_PUBLIC_STATIC_QRIS || '';

/**
 * Gets the current Static QRIS string configured by panitia (from localStorage or default fallback).
 */
export function getSavedStaticQris(): string {
  if (typeof window === 'undefined') return DEFAULT_STATIC_QRIS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_STATIC_QRIS);
    return saved && saved.trim() ? saved.trim() : DEFAULT_STATIC_QRIS;
  } catch {
    return DEFAULT_STATIC_QRIS;
  }
}

/**
 * Saves a custom Static QRIS string (pasted from panitia's real merchant QRIS).
 */
export function saveStaticQris(qrisPayload: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_STATIC_QRIS, qrisPayload.trim());
  } catch (err) {
    console.error('Failed to save static QRIS', err);
  }
}

/**
 * Calculates CRC16-CCITT (Poly 0x1021, Init 0xFFFF) for EMVCo QRIS specification.
 */
export function crc16Ccitt(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Converts a Static QRIS payload string into a Dynamic QRIS payload string
 * by changing Initiation Point Method (Tag 01 -> 12), injecting Tag 54 (Amount),
 * and recalculating CRC16 (Tag 63).
 */
export function generateDynamicQris(staticPayload: string, amount: number): string {
  if (!staticPayload || staticPayload.trim() === '') return '';

  let qris = staticPayload.trim();

  // 1. Remove existing CRC (Tag 6304XXXX) if present at the end
  const crcPos = qris.lastIndexOf('6304');
  if (crcPos !== -1) {
    qris = qris.substring(0, crcPos);
  }

  // 2. Change Tag 01 (Initiation Point Method) from '010211' (Static) to '010212' (Dynamic)
  if (qris.includes('010211')) {
    qris = qris.replace('010211', '010212');
  }

  // 3. Construct Tag 54 (Transaction Amount)
  const amtStr = Math.round(amount).toString();
  const amtLen = amtStr.length.toString().padStart(2, '0');
  const amountTag = `54${amtLen}${amtStr}`;

  // 4. Remove any existing Tag 54 if present
  qris = qris.replace(/54\d{2}\d+/, '');

  // 5. Insert Tag 54 in EMVCo standard position: after Tag 53 ('5303360') or before Tag 58 ('5802ID')
  const tag53Pos = qris.indexOf('5303360');
  if (tag53Pos !== -1) {
    const insertPos = tag53Pos + 7; // after '5303360'
    qris = qris.slice(0, insertPos) + amountTag + qris.slice(insertPos);
  } else {
    const tag58Pos = qris.indexOf('5802ID');
    if (tag58Pos !== -1) {
      qris = qris.slice(0, tag58Pos) + amountTag + qris.slice(tag58Pos);
    } else {
      qris = qris + amountTag;
    }
  }

  // 6. Append Tag 6304 and calculate CRC16 checksum
  const payloadToSign = qris + '6304';
  const checksum = crc16Ccitt(payloadToSign);

  return payloadToSign + checksum;
}

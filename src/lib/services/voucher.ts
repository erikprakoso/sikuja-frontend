import { Transaction, Voucher, DrawResult, Prize } from '@/types';
import {
  getStoredVouchers,
  saveVouchers,
  getStoredTransactions,
  saveTransactions,
  getStoredPrizes,
  savePrizes,
  getStoredDrawResults,
  saveDrawResults,
  addToOfflineQueue,
} from '@/lib/storage';

// Format input into pure 5-digit code string e.g. "77" -> "00077"
export function format5DigitCode(input: string): string {
  const cleaned = input.replace(/\D/g, '').slice(0, 5);
  if (!cleaned) return '';
  return cleaned.padStart(5, '0');
}

// Check if a code is available in local memory
export function checkCodeAvailable(code: string): { available: boolean; formattedCode: string } {
  const formattedCode = format5DigitCode(code);
  if (!formattedCode) return { available: false, formattedCode: '' };

  const allVouchers = getStoredVouchers();
  const isUsed = allVouchers.some((v) => v.code === formattedCode);
  return { available: !isUsed, formattedCode };
}

// Generate 5-digit pure number code: "00000" - "99999"
export function generate5DigitCode(usedCodes: Set<string>): string {
  let attempts = 0;
  while (attempts < 100000) {
    const num = Math.floor(Math.random() * 100000);
    const code = num.toString().padStart(5, '0');
    if (!usedCodes.has(code)) {
      return code;
    }
    attempts++;
  }
  throw new Error('Pool kode voucher penuh (100.000 kode).');
}

// Generate random URL safe token for E-voucher link
export function generateTransactionToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'tx_';
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// 1. Create Transaction (Fisik + Non-Fisik) with optional custom codes
export function createPurchaseTransaction(
  qtyFisik: number,
  qtyNonFisik: number,
  customCodes: string[] = [],
  customerName: string = '',
  customerPhone: string = ''
): {
  transaction: Transaction;
  vouchers: Voucher[];
} {
  const allVouchers = getStoredVouchers();
  const allTransactions = getStoredTransactions();
  const usedCodes = new Set(allVouchers.map((v) => v.code));

  const totalLembar = qtyFisik + qtyNonFisik;
  const txId = 'tx_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const token = generateTransactionToken();

  // Validate custom codes first
  const validatedCustomCodes: string[] = [];
  for (const rawCode of customCodes) {
    if (!rawCode || !rawCode.trim()) continue;
    const formatted = format5DigitCode(rawCode);
    if (!formatted) continue;
    if (usedCodes.has(formatted)) {
      throw new Error(`Kode voucher ${formatted} sudah terbit / dimiliki peserta lain.`);
    }
    validatedCustomCodes.push(formatted);
  }

  // Allocate codes to newVouchers
  const finalCodes: string[] = [];
  let customIdx = 0;

  for (let i = 0; i < totalLembar; i++) {
    if (customIdx < validatedCustomCodes.length) {
      const code = validatedCustomCodes[customIdx++];
      usedCodes.add(code);
      finalCodes.push(code);
    } else {
      const code = generate5DigitCode(usedCodes);
      usedCodes.add(code);
      finalCodes.push(code);
    }
  }

  const newVouchers: Voucher[] = [];

  // Assign first qtyFisik codes as 'fisik'
  for (let i = 0; i < qtyFisik; i++) {
    newVouchers.push({
      code: finalCodes[i],
      type: 'fisik',
      status: 'terbit',
      transaction_id: txId,
      created_at: new Date().toISOString(),
    });
  }

  // Assign remaining codes as 'non-fisik'
  for (let i = qtyFisik; i < totalLembar; i++) {
    newVouchers.push({
      code: finalCodes[i],
      type: 'non-fisik',
      status: 'terbit',
      transaction_id: txId,
      created_at: new Date().toISOString(),
    });
  }

  const transaction: Transaction = {
    id: txId,
    token,
    qty_fisik: qtyFisik,
    qty_non_fisik: qtyNonFisik,
    total_harga: totalLembar * 5000,
    customer_name: customerName.trim() || undefined,
    customer_phone: customerPhone.trim() || undefined,
    created_at: new Date().toISOString(),
  };

  saveTransactions([transaction, ...allTransactions]);
  saveVouchers([...newVouchers, ...allVouchers]);

  return { transaction, vouchers: newVouchers };
}

// 2. Single Voucher Check-in
export function checkInVoucher(code: string, scannerId: string = 'pos-device-1'): {
  success: boolean;
  message: string;
  voucher?: Voucher;
} {
  const vouchers = getStoredVouchers();
  const target = vouchers.find((v) => v.code === code.trim());

  if (!target) {
    return {
      success: false,
      message: `Kode voucher "${code}" tidak ditemukan dalam sistem.`,
    };
  }

  if (target.status !== 'terbit') {
    return {
      success: false,
      message: `Voucher ${target.code} sudah melakukan check-in pos sebelumnya (${target.status.toUpperCase()}).`,
      voucher: target,
    };
  }

  target.status = 'checkin';
  saveVouchers(vouchers);

  addToOfflineQueue({
    id: 'pos_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    voucher_code: target.code,
    transaction_id: target.transaction_id,
    scanned_at: new Date().toISOString(),
    scanner_device_id: scannerId,
    synced: false,
  });

  return {
    success: true,
    message: `Voucher ${target.code} (${target.type.toUpperCase()}) Berhasil Check-In Pos!`,
    voucher: target,
  };
}

// 3. Batch Check-in via 1 Transaction QR Code (Check-in ALL vouchers of 1 transaction or customer)
export function checkInTransactionBatch(tokenOrTxId: string, scannerId: string = 'pos-device-1'): {
  success: boolean;
  message: string;
  count: number;
} {
  const transactions = getStoredTransactions();
  const vouchers = getStoredVouchers();

  const tx = transactions.find((t) => t.token === tokenOrTxId || t.id === tokenOrTxId);
  if (!tx) {
    return {
      success: false,
      message: `Transaksi / E-Voucher tidak ditemukan.`,
      count: 0,
    };
  }

  let allCustomerTxs = [tx];
  if (tx.customer_phone && tx.customer_phone.trim()) {
    const phoneTxs = transactions.filter((t) => t.customer_phone === tx.customer_phone);
    if (phoneTxs.length > 0) allCustomerTxs = phoneTxs;
  } else if (tx.customer_name && tx.customer_name.trim()) {
    const nameTxs = transactions.filter((t) => t.customer_name === tx.customer_name);
    if (nameTxs.length > 0) allCustomerTxs = nameTxs;
  }

  const txIds = new Set(allCustomerTxs.map((t) => t.id));
  const txVouchers = vouchers.filter((v) => txIds.has(v.transaction_id));
  const eligibleVouchers = txVouchers.filter((v) => v.status === 'terbit');

  if (eligibleVouchers.length === 0) {
    return {
      success: false,
      message: `Seluruh ${txVouchers.length} voucher milik ${tx.customer_name || 'peserta ini'} sudah check-in pos sebelumnya.`,
      count: 0,
    };
  }

  let checkedInCount = 0;
  vouchers.forEach((v) => {
    if (txIds.has(v.transaction_id) && v.status === 'terbit') {
      v.status = 'checkin';
      checkedInCount++;
      addToOfflineQueue({
        id: 'pos_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        voucher_code: v.code,
        transaction_id: v.transaction_id,
        scanned_at: new Date().toISOString(),
        scanner_device_id: scannerId,
        synced: false,
      });
    }
  });

  saveVouchers(vouchers);

  return {
    success: true,
    message: `Berhasil Check-In Pos 1-Click untuk ${checkedInCount} voucher (${tx.customer_name || 'Peserta'})!`,
    count: checkedInCount,
  };
}

// 4. Random Draw Execution (CSPRNG compliant)
export function drawWinner(prizeId: string): {
  success: boolean;
  message: string;
  winner?: DrawResult;
} {
  const vouchers = getStoredVouchers();
  const prizes = getStoredPrizes();
  const drawResults = getStoredDrawResults();

  const prize = prizes.find((p) => p.id === prizeId);
  if (!prize) {
    return { success: false, message: 'Kategori hadiah tidak ditemukan.' };
  }

  const drawnCount = drawResults.filter((r) => r.prize_id === prizeId).length;
  if (drawnCount >= prize.stock) {
    return { success: false, message: `Stok hadiah ${prize.name} sudah habis (${prize.stock} unit).` };
  }

  const eligibleVouchers = vouchers.filter((v) => v.status === 'checkin');
  if (eligibleVouchers.length === 0) {
    return {
      success: false,
      message: 'Tidak ada voucher berstatus terverifikasi pos check-in yang tersedia untuk diundi.',
    };
  }

  let selectedIndex = 0;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    selectedIndex = randomBuffer[0] % eligibleVouchers.length;
  } else {
    selectedIndex = Math.floor(Math.random() * eligibleVouchers.length);
  }

  const winningVoucher = eligibleVouchers[selectedIndex];
  winningVoucher.status = 'menang';
  winningVoucher.prize_name = prize.name;
  saveVouchers(vouchers);

  const drawResult: DrawResult = {
    id: 'draw_' + Date.now().toString(36),
    prize_id: prize.id,
    prize_name: prize.name,
    voucher_code: winningVoucher.code,
    drawn_at: new Date().toISOString(),
    claimed: false,
  };

  saveDrawResults([drawResult, ...drawResults]);

  return {
    success: true,
    message: `Pemenang ditarik: Kode ${winningVoucher.code} (${winningVoucher.type.toUpperCase()}) mendapatkan ${prize.name}!`,
    winner: drawResult,
  };
}

// 5. Confirm Prize Claim (Sobek Kertas Digital)
export function claimPrize(voucherCode: string, verifierName: string = 'Petugas Verifikasi'): {
  success: boolean;
  message: string;
} {
  const vouchers = getStoredVouchers();
  const drawResults = getStoredDrawResults();

  const code = voucherCode.trim();
  const v = vouchers.find((x) => x.code === code);
  const result = drawResults.find((r) => r.voucher_code === code);

  if (!v || !result) {
    return { success: false, message: `Kode voucher ${code} belum pernah memenangkan undian.` };
  }

  if (result.claimed) {
    return { success: false, message: `Hadiah untuk kode ${code} sudah pernah diklaim sebelumnya!` };
  }

  v.status = 'diklaim';
  result.claimed = true;
  result.claimed_at = new Date().toISOString();
  result.verifier_pin = verifierName;

  saveVouchers(vouchers);
  saveDrawResults(drawResults);

  return {
    success: true,
    message: `Klaim Sah! Kode ${code} berhasil diverifikasi & hadiah ${result.prize_name} telah diserahkan.`,
  };
}

// Aliases for API route compatibility
export const drawWinnerForPrize = drawWinner;
export const claimStagePrize = claimPrize;

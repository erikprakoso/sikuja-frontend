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

// 1. Create Transaction (Fisik + Non-Fisik)
export function createPurchaseTransaction(qtyFisik: number, qtyNonFisik: number): {
  transaction: Transaction;
  vouchers: Voucher[];
} {
  const allVouchers = getStoredVouchers();
  const allTransactions = getStoredTransactions();
  const usedCodes = new Set(allVouchers.map((v) => v.code));

  const txId = 'tx_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const token = generateTransactionToken();

  const newVouchers: Voucher[] = [];

  // Generate Fisik vouchers
  for (let i = 0; i < qtyFisik; i++) {
    const code = generate5DigitCode(usedCodes);
    usedCodes.add(code);
    newVouchers.push({
      code,
      type: 'fisik',
      status: 'terbit',
      transaction_id: txId,
      created_at: new Date().toISOString(),
    });
  }

  // Generate Non-Fisik (E-voucher) vouchers
  for (let i = 0; i < qtyNonFisik; i++) {
    const code = generate5DigitCode(usedCodes);
    usedCodes.add(code);
    newVouchers.push({
      code,
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
    total_harga: (qtyFisik + qtyNonFisik) * 5000,
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
    return { success: false, message: `Kode voucher ${code} tidak ditemukan dalam sistem!` };
  }

  if (target.status === 'checkin' || target.status === 'menang' || target.status === 'diklaim') {
    return {
      success: true,
      message: `Kode voucher ${code} sudah berstatus check-in sebelumnya.`,
      voucher: target,
    };
  }

  // Check connection status
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  target.status = 'checkin';
  target.checkin_at = new Date().toISOString();
  saveVouchers(vouchers);

  if (!isOnline) {
    addToOfflineQueue({
      id: 'ck_' + Date.now(),
      voucher_code: target.code,
      transaction_id: target.transaction_id,
      scanned_at: new Date().toISOString(),
      scanner_device_id: scannerId,
      synced: false,
    });
  }

  return {
    success: true,
    message: `Berhasil check-in voucher ${code}! Kode ini sah mengikuti undian.`,
    voucher: target,
  };
}

// 3. Batch Check-in All Vouchers in a Transaction (1 QR Scan at Pos)
export function checkInTransactionBatch(tokenOrId: string, scannerId: string = 'pos-device-1'): {
  success: boolean;
  message: string;
  count: number;
} {
  const txs = getStoredTransactions();
  const targetTx = txs.find((t) => t.token === tokenOrId || t.id === tokenOrId);

  if (!targetTx) {
    return { success: false, message: 'Transaksi tidak ditemukan!', count: 0 };
  }

  const vouchers = getStoredVouchers();
  const txVouchers = vouchers.filter((v) => v.transaction_id === targetTx.id);

  if (txVouchers.length === 0) {
    return { success: false, message: 'Tidak ada voucher dalam transaksi ini.', count: 0 };
  }

  let updatedCount = 0;
  const now = new Date().toISOString();

  txVouchers.forEach((v) => {
    if (v.status === 'terbit') {
      v.status = 'checkin';
      v.checkin_at = now;
      updatedCount++;
    }
  });

  saveVouchers(vouchers);

  return {
    success: true,
    message: `Berhasil check-in ${updatedCount} voucher (dari total ${txVouchers.length} voucher dalam transaksi ini).`,
    count: updatedCount,
  };
}

// 4. Draw Random Winner for a Prize
export function drawWinnerForPrize(prizeId: string, forfeitCode?: string): {
  success: boolean;
  winnerVoucher?: Voucher;
  prize?: Prize;
  error?: string;
} {
  const prizes = getStoredPrizes();
  const prize = prizes.find((p) => p.id === prizeId);

  if (!prize) {
    return { success: false, error: 'Hadiah tidak ditemukan!' };
  }

  const vouchers = getStoredVouchers();

  if (forfeitCode) {
    const prevWinner = vouchers.find((v) => v.code === forfeitCode);
    if (prevWinner) {
      prevWinner.status = 'checkin';
      prevWinner.won_at = undefined;
      prevWinner.prize_id = undefined;
      prevWinner.prize_name = undefined;
    }
    if (prize.drawn_count > 0) {
      prize.drawn_count -= 1;
    }
  }

  if (prize.drawn_count >= prize.stock) {
    return { success: false, error: `Stok hadiah ${prize.name} sudah habis!` };
  }

  // Filter only valid checked-in vouchers that haven't won yet
  const eligibleVouchers = vouchers.filter((v) => v.status === 'checkin');

  if (eligibleVouchers.length === 0) {
    return {
      success: false,
      error: 'Tidak ada kode voucher yang eligible (sudah check-in di pos & belum menang)!',
    };
  }

  // Pick random winner
  const randomIndex = Math.floor(Math.random() * eligibleVouchers.length);
  const winner = eligibleVouchers[randomIndex];

  winner.status = 'menang';
  winner.won_at = new Date().toISOString();
  winner.prize_id = prize.id;
  winner.prize_name = prize.name;

  prize.drawn_count += 1;

  // Save draw result
  const results = getStoredDrawResults();
  const newResult: DrawResult = {
    id: 'res_' + Date.now(),
    voucher_code: winner.code,
    prize_id: prize.id,
    prize_name: prize.name,
    drawn_at: new Date().toISOString(),
    claimed: false,
  };

  saveVouchers(vouchers);
  savePrizes(prizes);
  saveDrawResults([newResult, ...results]);

  return {
    success: true,
    winnerVoucher: winner,
    prize,
  };
}

// 5. Stage Claim Verification (Mark code as claimed)
export function claimStagePrize(voucherCode: string, verifierPin: string = '4444'): {
  success: boolean;
  message: string;
} {
  const vouchers = getStoredVouchers();
  const target = vouchers.find((v) => v.code === voucherCode.trim());

  if (!target) {
    return { success: false, message: `Kode ${voucherCode} tidak ditemukan.` };
  }

  if (target.status !== 'menang') {
    return {
      success: false,
      message: `Kode ${voucherCode} berstatus '${target.status}'. Hanya kode pemenang yang dapat diklaim!`,
    };
  }

  target.status = 'diklaim';
  target.claimed_at = new Date().toISOString();

  const results = getStoredDrawResults();
  const res = results.find((r) => r.voucher_code === target.code);
  if (res) {
    res.claimed = true;
    res.claimed_at = target.claimed_at;
    res.verifier_pin = verifierPin;
  }

  saveVouchers(vouchers);
  saveDrawResults(results);

  return {
    success: true,
    message: `Berhasil! Voucher ${voucherCode} resmi diklaim & ditandai sudah diambil (sobek digital).`,
  };
}

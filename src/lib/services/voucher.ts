import { Transaction, Voucher, DrawResult, Prize } from '@/types';
import {
  getStoredVouchers,
  saveVouchers,
  getStoredTransactions,
  saveTransactions,
  getStoredPrizes,
  getStoredDrawResults,
  saveDrawResults,
  addToOfflineQueue,
  SIKUJA_MAX_PRIZES_PER_PERSON,
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

// Generate random URL safe token for E-voucher link (CSPRNG-backed)
export function generateTransactionToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let token = 'tx_';
  for (let i = 0; i < bytes.length; i++) {
    token += chars.charAt(bytes[i] % chars.length);
  }
  return token;
}

// 1. Create Transaction (Fisik + Non-Fisik) with optional custom codes
export function createPurchaseTransaction(
  qtyFisik: number,
  qtyNonFisik: number,
  customCodes: string[] = [],
  customerName: string = '',
  customerPhone: string = '',
  paymentMethod: 'cash' | 'qris' | 'free' = 'cash'
): {
  transaction: Transaction;
  vouchers: Voucher[];
} {
  const allVouchers = getStoredVouchers();
  const allTransactions = getStoredTransactions();
  const usedCodes = new Set(allVouchers.map((v) => v.code));

  const totalLembar = qtyFisik + qtyNonFisik;
  const txId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? 'tx_' + crypto.randomUUID()
      : 'tx_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
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
    total_harga: paymentMethod === 'free' ? 0 : totalLembar * 5000,
    customer_name: customerName.trim() || undefined,
    customer_phone: customerPhone.trim() || undefined,
    payment_method: paymentMethod,
    created_at: new Date().toISOString(),
  };

  saveTransactions([transaction, ...allTransactions]);
  saveVouchers([...newVouchers, ...allVouchers]);

  return { transaction, vouchers: newVouchers };
}

// 1b. Append voucher baru ke transaksi yang SUDAH ADA (alur nama kembar / isi otomatis).
// Token & ID transaksi tetap; qty & total_harga dijumlahkan; kode unik 5-digit tetap.
export function appendVouchersToTransaction(
  txId: string,
  qtyFisik: number,
  qtyNonFisik: number,
  customCodes: string[] = [],
  customerPhone: string = '',
  paymentMethod: 'cash' | 'qris' | 'free' = 'cash'
): {
  transaction: Transaction;
  vouchers: Voucher[];
} {
  const allVouchers = getStoredVouchers();
  const allTransactions = getStoredTransactions();
  const existing = allTransactions.find((t) => t.id === txId);
  if (!existing) {
    throw new Error('Transaksi tujuan tidak ditemukan.');
  }

  const usedCodes = new Set(allVouchers.map((v) => v.code));
  const totalLembar = qtyFisik + qtyNonFisik;

  // Validasi custom codes terhadap snapshot lokal terbaru.
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

  for (let i = 0; i < qtyFisik; i++) {
    newVouchers.push({
      code: finalCodes[i],
      type: 'fisik',
      status: 'terbit',
      transaction_id: txId,
      created_at: new Date().toISOString(),
    });
  }

  for (let i = qtyFisik; i < totalLembar; i++) {
    newVouchers.push({
      code: finalCodes[i],
      type: 'non-fisik',
      status: 'terbit',
      transaction_id: txId,
      created_at: new Date().toISOString(),
    });
  }

  const updatedTx: Transaction = {
    ...existing,
    qty_fisik: (existing.qty_fisik || 0) + qtyFisik,
    qty_non_fisik: (existing.qty_non_fisik || 0) + qtyNonFisik,
    total_harga: (existing.total_harga || 0) + (paymentMethod === 'free' ? 0 : totalLembar * 5000),
    payment_method: paymentMethod,
    ...(customerPhone.trim() ? { customer_phone: customerPhone.trim() } : {}),
  };

  saveTransactions(allTransactions.map((t) => (t.id === txId ? updatedTx : t)));
  saveVouchers([...newVouchers, ...allVouchers]);

  // Kembalikan SELURUH voucher milik transaksi (lama + baru) agar hasil akhir
  // konsisten dengan qty kumulatif yang ditampilkan di TransactionResult / struk.
  const allOfTx = getStoredVouchers().filter((v) => v.transaction_id === txId);

  return { transaction: updatedTx, vouchers: allOfTx };
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

export interface TransactionMatch {
  tx: Transaction;
  vouchers: Voucher[];
  totalVouchers: number;
  pendingVouchers: number;
}

// Cari transaksi berdasarkan nama / no. HP / token untuk alur validasi berbasis
// pencarian. Hasil diurutkan: yang masih butuh verifikasi duluan, lalu terbaru.
export function searchTransactions(query: string, limit = 30): TransactionMatch[] {
  const q = query.trim();
  if (!q) return [];

  const transactions = getStoredTransactions();
  const vouchers = getStoredVouchers();
  const lower = q.toLowerCase();
  const digits = q.replace(/\D/g, '');

  const matched = transactions.filter((t) => {
    if (t.customer_name && t.customer_name.toLowerCase().includes(lower)) return true;
    if (digits && t.customer_phone) {
      const phoneDigits = t.customer_phone.replace(/\D/g, '');
      if (phoneDigits.includes(digits) || digits.includes(phoneDigits)) return true;
    }
    if (t.token && t.token.toLowerCase().includes(lower)) return true;
    return false;
  });

  const withCounts: TransactionMatch[] = matched.map((tx) => {
    const txVouchers = vouchers.filter((v) => v.transaction_id === tx.id);
    return {
      tx,
      vouchers: txVouchers,
      totalVouchers: txVouchers.length,
      pendingVouchers: txVouchers.filter((v) => v.status === 'terbit').length,
    };
  });

  withCounts.sort((a, b) => {
    if (a.pendingVouchers > 0 && b.pendingVouchers === 0) return -1;
    if (a.pendingVouchers === 0 && b.pendingVouchers > 0) return 1;
    return new Date(b.tx.created_at).getTime() - new Date(a.tx.created_at).getTime();
  });

  return withCounts.slice(0, limit);
}

// 3. Batch Check-in via 1 Transaction QR Code (Check-in ALL vouchers of 1 transaction or customer)
//    Input bisa: token / tx id / 1 kode 5-digit (→ transaksi terkait) / no. HP / nama pemilik.
//    options.exact=true → hanya transaksi tersebut yang diverifikasi (tanpa pengelompokan no. HP / nama).
export function checkInTransactionBatch(
  tokenOrTxId: string,
  scannerId: string = 'pos-device-1',
  options: { exact?: boolean } = {}
): {
  success: boolean;
  message: string;
  count: number;
} {
  const transactions = getStoredTransactions();
  const vouchers = getStoredVouchers();

  const input = tokenOrTxId.trim();

  // Resolve input menjadi satu transaksi (semua mode lookup).
  let tx = transactions.find((t) => t.token === input || t.id === input);

  if (!tx) {
    const code = format5DigitCode(input);
    if (code) {
      const v = vouchers.find((x) => x.code === code);
      if (v) tx = transactions.find((t) => t.id === v.transaction_id);
    }
  }

  if (!tx) {
    const digits = input.replace(/\D/g, '');
    if (digits.length >= 8) {
      tx =
        transactions.find((t) => t.customer_phone === input) ||
        transactions.find((t) => t.customer_phone && t.customer_phone.replace(/\D/g, '') === digits);
    }
  }

  if (!tx) {
    const lowerInput = input.toLowerCase();
    tx = transactions.find(
      (t) => t.customer_name && t.customer_name.trim().toLowerCase().includes(lowerInput)
    );
  }

  if (!tx) {
    return {
      success: false,
      message: `Transaksi / E-Voucher tidak ditemukan.`,
      count: 0,
    };
  }

  let allCustomerTxs = [tx];
  if (!options.exact) {
    if (tx.customer_phone && tx.customer_phone.trim()) {
      const phoneTxs = transactions.filter((t) => t.customer_phone === tx.customer_phone);
      if (phoneTxs.length > 0) allCustomerTxs = phoneTxs;
    } else if (tx.customer_name && tx.customer_name.trim()) {
      const nameTxs = transactions.filter((t) => t.customer_name === tx.customer_name);
      if (nameTxs.length > 0) allCustomerTxs = nameTxs;
    }
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
export function drawWinner(prizeId: string, excludeCode?: string): {
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

  let eligibleVouchers = vouchers.filter((v) => v.status === 'checkin');

  // Kebijakan undian: pembeli yang sudah memenangkan maksimal N doorprize
  // (status 'menang'/'diklaim') seluruh kuponnya keluar dari pool undian.
  // Nilai 0 = tanpa batas (0 juga berarti filter nonaktif — undian bebas).
  if (SIKUJA_MAX_PRIZES_PER_PERSON > 0) {
    const winCountByTx = new Map<string, number>();
    vouchers.forEach((v) => {
      if (v.status === 'menang' || v.status === 'diklaim') {
        winCountByTx.set(v.transaction_id, (winCountByTx.get(v.transaction_id) || 0) + 1);
      }
    });
    eligibleVouchers = eligibleVouchers.filter(
      (v) => (winCountByTx.get(v.transaction_id) || 0) < SIKUJA_MAX_PRIZES_PER_PERSON
    );
  }

  // Undian ulang setelah gugur: kupon yang digugurkan dianggap HANGUS (status
  // diubah 'forfeited' agar tidak pernah masuk pool lagi), dan semua kupon milik
  // pembeli yang sama ikut dikecualikan dari undian ulang kali ini.
  if (excludeCode) {
    const forfeited = vouchers.find((v) => v.code === excludeCode);
    if (forfeited) {
      forfeited.status = 'forfeited';
      saveVouchers(vouchers);
      eligibleVouchers = eligibleVouchers.filter((v) => v.transaction_id !== forfeited.transaction_id);
    }
  }

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
  result.verifier_name = verifierName;

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

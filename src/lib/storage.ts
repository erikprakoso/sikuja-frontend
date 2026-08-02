import { Voucher, Transaction, Purchase, Prize, DrawResult, PosCheckin } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';

const STORAGE_KEYS = {
  TRANSACTIONS: 'sikuja_transactions',
  VOUCHERS: 'sikuja_vouchers',
  PURCHASES: 'sikuja_purchases',
  DRAW_RESULTS: 'sikuja_draw_results',
  OFFLINE_QUEUE: 'sikuja_offline_queue',
};

export const SIKUJA_EVENT_NAME = 'sikuja_data_changed';

export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    const vUrl = process.env.NEXT_PUBLIC_VERCEL_URL.replace(/\/$/, '');
    return vUrl.startsWith('http') ? vUrl : `https://${vUrl}`;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

function notifyListeners() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SIKUJA_EVENT_NAME));
  }
}

export async function syncFromSupabase(): Promise<boolean> {
  try {
    // Read operational data via authenticated server route
    const res = await fetch('/api/data');
    if (!res.ok) return false;

    const data = await res.json();
    if (!data.success) return false;

    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions || []));
    localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(data.vouchers || []));
    if (Array.isArray(data.purchases)) {
      localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(data.purchases));
    }
    localStorage.setItem(STORAGE_KEYS.DRAW_RESULTS, JSON.stringify(data.drawResults || []));

    notifyListeners();
    return true;
  } catch (err) {
    console.error('Failed to sync from server', err);
    return false;
  }
}

export function getStoredTransactions(): Transaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveTransactions(txs: Transaction[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
  notifyListeners();
}

export function getStoredVouchers(): Voucher[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VOUCHERS);
    if (raw) return JSON.parse(raw);
    
    if (!isSupabaseConfigured()) {
      const seed = seedInitialVouchers();
      localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(seed));
      return seed;
    }
    return [];
  } catch {
    return [];
  }
}

function seedInitialVouchers(): Voucher[] {
  const seedTxId = 'tx_demo_seed_001';
  const seedToken = 'demo-agustusan-2026';
  const seedTx: Transaction = {
    id: seedTxId,
    token: seedToken,
    qty_fisik: 5,
    qty_non_fisik: 5,
    total_harga: 50000,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  };
  saveTransactions([seedTx]);

  const vouchers: Voucher[] = [
    { code: '01234', type: 'fisik', status: 'terbit', transaction_id: seedTxId, created_at: new Date().toISOString() },
    { code: '05678', type: 'fisik', status: 'checkin', transaction_id: seedTxId, created_at: new Date().toISOString(), checkin_at: new Date().toISOString() },
    { code: '09876', type: 'non-fisik', status: 'checkin', transaction_id: seedTxId, created_at: new Date().toISOString(), checkin_at: new Date().toISOString() },
    { code: '11223', type: 'non-fisik', status: 'terbit', transaction_id: seedTxId, created_at: new Date().toISOString() },
    { code: '33445', type: 'non-fisik', status: 'checkin', transaction_id: seedTxId, created_at: new Date().toISOString(), checkin_at: new Date().toISOString() },
    { code: '55667', type: 'fisik', status: 'checkin', transaction_id: seedTxId, created_at: new Date().toISOString(), checkin_at: new Date().toISOString() },
    { code: '77889', type: 'non-fisik', status: 'checkin', transaction_id: seedTxId, created_at: new Date().toISOString(), checkin_at: new Date().toISOString() },
    { code: '99001', type: 'fisik', status: 'checkin', transaction_id: seedTxId, created_at: new Date().toISOString(), checkin_at: new Date().toISOString() },
  ];
  return vouchers;
}

export async function saveVouchers(vouchers: Voucher[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(vouchers));
  notifyListeners();
}

export function getStoredPurchases(): Purchase[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePurchases(purchases: Purchase[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  notifyListeners();
}

/**
 * Compute Prize Categories & Stock dynamically from Purchases (is_doorprize: true) and Draw Results
 */
export function computePrizesFromPurchases(purchases: Purchase[], drawResults: DrawResult[] = []): Prize[] {
  const doorprizePurchases = purchases.filter((p) => p.is_doorprize !== false);

  const map = new Map<string, { name: string; stock: number; firstId: string; price: number }>();

  for (const p of doorprizePurchases) {
    const trimmedName = p.item_name.trim();
    const key = trimmedName.toLowerCase();
    if (map.has(key)) {
      const existing = map.get(key)!;
      existing.stock += p.qty;
    } else {
      map.set(key, {
        name: trimmedName,
        stock: p.qty,
        firstId: p.id,
        price: p.price_per_unit,
      });
    }
  }

  const prizes: Prize[] = [];
  let orderNum = 1;

  for (const [key, item] of map.entries()) {
    const drawn = drawResults.filter(
      (r) =>
        (r.prize_name && r.prize_name.trim().toLowerCase() === key) ||
        (r.prize_id && r.prize_id.trim().toLowerCase() === key) ||
        r.prize_id === item.firstId
    ).length;

    prizes.push({
      id: item.firstId,
      name: item.name,
      stock: item.stock,
      drawn_count: drawn,
      order_num: orderNum++,
      price_per_unit: item.price,
    });
  }

  return prizes;
}

export function getStoredPrizes(): Prize[] {
  const purchases = getStoredPurchases();
  const drawResults = getStoredDrawResults();
  return computePrizesFromPurchases(purchases, drawResults);
}

export function getStoredDrawResults(): DrawResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DRAW_RESULTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveDrawResults(results: DrawResult[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.DRAW_RESULTS, JSON.stringify(results));
  notifyListeners();
}

// Offline Queue Management for POS Check-in
export function getOfflineQueue(): PosCheckin[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToOfflineQueue(item: PosCheckin) {
  if (typeof window === 'undefined') return;
  const queue = getOfflineQueue();
  queue.push(item);
  localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  notifyListeners();
}

export function saveOfflineQueue(queue: PosCheckin[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  notifyListeners();
}

export function clearOfflineQueue() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  notifyListeners();
}

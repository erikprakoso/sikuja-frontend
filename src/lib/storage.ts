import { Voucher, Transaction, Prize, DrawResult, PosCheckin } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';

const STORAGE_KEYS = {
  TRANSACTIONS: 'sikuja_transactions',
  VOUCHERS: 'sikuja_vouchers',
  PRIZES: 'sikuja_prizes',
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

// Initial Seed Data for testing & immediate deployment
const INITIAL_PRIZES: Prize[] = [
  { id: 'p1', name: 'Kipas Angin Stand Fan', stock: 5, drawn_count: 0, order_num: 1, icon: 'Wind' },
  { id: 'p2', name: 'Kompor Gas 2 Tungku', stock: 3, drawn_count: 0, order_num: 2, icon: 'Flame' },
  { id: 'p3', name: 'Rice Cooker Digital', stock: 3, drawn_count: 0, order_num: 3, icon: 'Utensils' },
  { id: 'p4', name: 'TV LED 32 Inch', stock: 2, drawn_count: 0, order_num: 4, icon: 'Tv' },
  { id: 'p5', name: 'Sepeda Gunung MTB', stock: 2, drawn_count: 0, order_num: 5, icon: 'Bike' },
  { id: 'p6', name: 'Hadiah Utama: Sepeda Motor', stock: 1, drawn_count: 0, order_num: 6, icon: 'Trophy' },
];

export async function syncFromSupabase(): Promise<boolean> {
  try {
    // Semua read data operasional lewat API server yang WAJIB login.
    // Anonim mendapat 401 → tidak menimpa data lokal & tidak men-download PII.
    const res = await fetch('/api/data');
    if (!res.ok) return false;

    const data = await res.json();
    if (!data.success) return false;

    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions || []));
    localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(data.vouchers || []));
    if (Array.isArray(data.prizes)) {
      localStorage.setItem(STORAGE_KEYS.PRIZES, JSON.stringify(data.prizes));
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
    
    // Only seed initial vouchers if Supabase is NOT configured (standalone local demo mode)
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

export function getStoredPrizes(): Prize[] {
  if (typeof window === 'undefined') return INITIAL_PRIZES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRIZES);
    if (!raw) {
      if (!isSupabaseConfigured()) {
        localStorage.setItem(STORAGE_KEYS.PRIZES, JSON.stringify(INITIAL_PRIZES));
        return INITIAL_PRIZES;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PRIZES;
  }
}

export async function savePrizes(prizes: Prize[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PRIZES, JSON.stringify(prizes));
  notifyListeners();
}

export async function syncPurchaseToPrizeCategory(itemName: string, qty: number) {
  if (typeof window === 'undefined' || !itemName.trim() || qty <= 0) return;
  const normalizedName = itemName.trim();
  const currentPrizes = getStoredPrizes();
  
  const existingIndex = currentPrizes.findIndex(
    (p) => p.name.toLowerCase().trim() === normalizedName.toLowerCase()
  );

  let updatedPrizes: Prize[];

  if (existingIndex >= 0) {
    updatedPrizes = currentPrizes.map((p, idx) => {
      if (idx === existingIndex) {
        return {
          ...p,
          stock: p.stock + qty,
        };
      }
      return p;
    });
  } else {
    const newPrize: Prize = {
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: normalizedName,
      stock: qty,
      drawn_count: 0,
      order_num: currentPrizes.length + 1,
    };
    updatedPrizes = [...currentPrizes, newPrize];
  }

  await savePrizes(updatedPrizes);

  try {
    await fetch('/api/prizes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prizes: updatedPrizes }),
    });
  } catch (err) {
    console.error('Failed to sync prize to server:', err);
  }
}

export async function removePurchaseFromPrizeCategory(itemName: string, qty: number) {
  if (typeof window === 'undefined' || !itemName.trim() || qty <= 0) return;
  const normalizedName = itemName.trim().toLowerCase();
  const currentPrizes = getStoredPrizes();

  const existingIndex = currentPrizes.findIndex((p) => {
    const pName = p.name.trim().toLowerCase();
    return pName === normalizedName || normalizedName.includes(pName) || pName.includes(normalizedName);
  });

  if (existingIndex < 0) return;

  const targetPrize = currentPrizes[existingIndex];
  const newStock = Math.max(0, targetPrize.stock - qty);

  let updatedPrizes: Prize[];

  if (newStock <= 0) {
    updatedPrizes = currentPrizes.filter((_, idx) => idx !== existingIndex);
  } else {
    updatedPrizes = currentPrizes.map((p, idx) => {
      if (idx === existingIndex) {
        return {
          ...p,
          stock: newStock,
        };
      }
      return p;
    });
  }

  await savePrizes(updatedPrizes);

  try {
    await fetch('/api/prizes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prizes: updatedPrizes }),
    });
  } catch (err) {
    console.error('Failed to sync prize deletion to server:', err);
  }
}

export async function updatePurchasePrizeCategoryStock(
  oldName: string | undefined,
  oldQty: number | undefined,
  oldIsDoorprize: boolean | undefined,
  newName: string,
  newQty: number,
  newIsDoorprize: boolean
) {
  if (typeof window === 'undefined') return;

  let currentPrizes = getStoredPrizes();

  // 1. Deduct old stock if old purchase was a doorprize
  if (oldName && oldQty && oldQty > 0 && oldIsDoorprize !== false) {
    const normOld = oldName.trim().toLowerCase();
    const oldIdx = currentPrizes.findIndex((p) => {
      const pName = p.name.trim().toLowerCase();
      return pName === normOld || normOld.includes(pName) || pName.includes(normOld);
    });

    if (oldIdx >= 0) {
      const target = currentPrizes[oldIdx];
      const remainingStock = Math.max(0, target.stock - oldQty);
      if (remainingStock <= 0) {
        currentPrizes = currentPrizes.filter((_, idx) => idx !== oldIdx);
      } else {
        currentPrizes = currentPrizes.map((p, idx) =>
          idx === oldIdx ? { ...p, stock: remainingStock } : p
        );
      }
    }
  }

  // 2. Add new stock if new item is a doorprize
  if (newName.trim() && newQty > 0 && newIsDoorprize) {
    const normNew = newName.trim().toLowerCase();
    const newIdx = currentPrizes.findIndex((p) => {
      const pName = p.name.trim().toLowerCase();
      return pName === normNew || normNew.includes(pName) || pName.includes(normNew);
    });

    if (newIdx >= 0) {
      currentPrizes = currentPrizes.map((p, idx) =>
        idx === newIdx ? { ...p, stock: p.stock + newQty } : p
      );
    } else {
      const newPrize: Prize = {
        id: 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name: newName.trim(),
        stock: newQty,
        drawn_count: 0,
        order_num: currentPrizes.length + 1,
      };
      currentPrizes = [...currentPrizes, newPrize];
    }
  }

  // 3. Save atomically once
  await savePrizes(currentPrizes);

  try {
    await fetch('/api/prizes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prizes: currentPrizes }),
    });
  } catch (err) {
    console.error('Failed to update prize stock on server:', err);
  }
}

export async function deletePrizeFromStore(prizeId: string) {
  if (typeof window === 'undefined') return;
  const prizes = getStoredPrizes().filter((p) => p.id !== prizeId);
  localStorage.setItem(STORAGE_KEYS.PRIZES, JSON.stringify(prizes));
  notifyListeners();
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

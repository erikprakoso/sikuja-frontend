import { Voucher, Transaction, Prize, DrawResult, PosCheckin } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const STORAGE_KEYS = {
  TRANSACTIONS: 'sivoja_transactions',
  VOUCHERS: 'sivoja_vouchers',
  PRIZES: 'sivoja_prizes',
  DRAW_RESULTS: 'sivoja_draw_results',
  OFFLINE_QUEUE: 'sivoja_offline_queue',
};

export const SIVOJA_EVENT_NAME = 'sivoja_data_changed';

function notifyListeners() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SIVOJA_EVENT_NAME));
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
  if (!isSupabaseConfigured()) return false;
  try {
    const [txRes, vRes, pRes, dRes] = await Promise.all([
      supabase.from('transactions').select('*'),
      supabase.from('vouchers').select('*'),
      supabase.from('prizes').select('*'),
      supabase.from('draw_results').select('*'),
    ]);

    if (txRes.data) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txRes.data));
    if (vRes.data) localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(vRes.data));
    if (pRes.data && pRes.data.length > 0) localStorage.setItem(STORAGE_KEYS.PRIZES, JSON.stringify(pRes.data));
    if (dRes.data) localStorage.setItem(STORAGE_KEYS.DRAW_RESULTS, JSON.stringify(dRes.data));

    notifyListeners();
    return true;
  } catch (err) {
    console.error('Failed to sync from Supabase', err);
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

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('transactions').upsert(txs);
    } catch (err) {
      console.error('Supabase saveTransactions error:', err);
    }
  }
}

export function getStoredVouchers(): Voucher[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VOUCHERS);
    if (raw) return JSON.parse(raw);
    
    // Seed initial vouchers if completely empty for instant demonstration
    const seed = seedInitialVouchers();
    localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(seed));
    return seed;
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

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('vouchers').upsert(vouchers);
    } catch (err) {
      console.error('Supabase saveVouchers error:', err);
    }
  }
}

export function getStoredPrizes(): Prize[] {
  if (typeof window === 'undefined') return INITIAL_PRIZES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRIZES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRIZES, JSON.stringify(INITIAL_PRIZES));
      return INITIAL_PRIZES;
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

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('prizes').upsert(prizes);
    } catch (err) {
      console.error('Supabase savePrizes error:', err);
    }
  }
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

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('draw_results').upsert(results);
    } catch (err) {
      console.error('Supabase saveDrawResults error:', err);
    }
  }
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

export function clearOfflineQueue() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  notifyListeners();
}

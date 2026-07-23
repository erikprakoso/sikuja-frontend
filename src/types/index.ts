export type VoucherType = 'fisik' | 'non-fisik';

export type VoucherStatus = 'terbit' | 'checkin' | 'menang' | 'diklaim';

export type RoleType = 'penjual' | 'pos' | 'mc' | 'verifikator' | 'admin';

export interface Voucher {
  code: string; // 5 digit numbers e.g. "04812"
  type: VoucherType;
  status: VoucherStatus;
  transaction_id: string;
  created_at: string;
  checkin_at?: string;
  won_at?: string;
  claimed_at?: string;
  prize_id?: string;
  prize_name?: string;
}

export interface Transaction {
  id: string;
  token: string; // random UUID/token for participant link e.g. "tx_a8f9c2..."
  qty_fisik: number;
  qty_non_fisik: number;
  total_harga: number; // qty * 5000
  created_at: string;
}

export interface Prize {
  id: string;
  name: string;
  stock: number;
  drawn_count: number;
  order_num: number;
  icon?: string;
}

export interface DrawResult {
  id: string;
  voucher_code: string;
  prize_id: string;
  prize_name: string;
  drawn_at: string;
  claimed: boolean;
  claimed_at?: string;
  verifier_pin?: string;
}

export interface PosCheckin {
  id: string;
  voucher_code: string;
  transaction_id: string;
  scanned_at: string;
  scanner_device_id: string;
  synced: boolean;
}

export interface UserSession {
  role: RoleType;
  name: string;
  authenticatedAt: string;
}

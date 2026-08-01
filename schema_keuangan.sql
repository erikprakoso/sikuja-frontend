-- ========================================================
-- SIKUJA — Migrasi: Sistem Keuangan (Donasi, Pembelian, Pengeluaran)
-- Salin & jalankan di SQL Editor Supabase.
-- ========================================================

-- 1. Tabel Donasi Masuk
CREATE TABLE IF NOT EXISTS public.donations (
  id TEXT PRIMARY KEY DEFAULT 'don_' || EXTRACT(EPOCH FROM NOW())::TEXT || '_' || MD5(RANDOM()::TEXT),
  donor_name TEXT NOT NULL,
  donor_phone TEXT,
  amount INT NOT NULL CHECK (amount >= 0),
  type TEXT NOT NULL DEFAULT 'tunai' CHECK (type IN ('tunai', 'non-tunai')),
  source TEXT NOT NULL DEFAULT 'umum',
  note TEXT,
  received_by TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donations_received_at ON public.donations(received_at DESC);

-- 2. Tabel Pembelian Barang / Doorprize
CREATE TABLE IF NOT EXISTS public.purchases (
  id TEXT PRIMARY KEY DEFAULT 'purch_' || EXTRACT(EPOCH FROM NOW())::TEXT || '_' || MD5(RANDOM()::TEXT),
  item_name TEXT NOT NULL,
  qty INT NOT NULL CHECK (qty > 0),
  price_per_unit INT NOT NULL CHECK (price_per_unit >= 0),
  total_price INT NOT NULL CHECK (total_price >= 0),
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_doorprize BOOLEAN NOT NULL DEFAULT TRUE,
  note TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Perintah ALTER jika tabel public.purchases sudah terlanjur dibuat sebelumnya:
ALTER TABLE public.purchases DROP COLUMN IF EXISTS supplier_name;
ALTER TABLE public.purchases DROP COLUMN IF EXISTS payment_method;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS is_doorprize BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON public.purchases(purchase_date DESC);

-- 3. Tabel Pengeluaran (biaya operasional: snack, sarpras, etc)
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY DEFAULT 'exp_' || EXTRACT(EPOCH FROM NOW())::TEXT || '_' || MD5(RANDOM()::TEXT),
  category TEXT NOT NULL DEFAULT 'umum' CHECK (category IN ('snack', 'sarpras', 'transport', 'akomodasi', 'dekorasi', 'lain-lain', 'umum')),
  item_name TEXT NOT NULL,
  qty INT NOT NULL CHECK (qty > 0),
  price_per_unit INT NOT NULL CHECK (price_per_unit >= 0),
  total_price INT NOT NULL CHECK (total_price >= 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'qris', 'transfer')),
  note TEXT,
  approved_by TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date DESC);

-- 4. RLS: tanpa policy — hanya service role yang akses (bypass RLS).
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

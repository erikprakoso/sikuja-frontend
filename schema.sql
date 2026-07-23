-- ========================================================
-- SIVOJA Database Schema SQL for Supabase Postgres
-- Salin dan jalankan script ini di SQL Editor di Supabase Dashboard
-- ========================================================

-- 1. Tabel Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  qty_fisik INT NOT NULL DEFAULT 0,
  qty_non_fisik INT NOT NULL DEFAULT 0,
  total_harga INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabel Vouchers (Pool 5-digit Kode Unik)
CREATE TABLE IF NOT EXISTS public.vouchers (
  code VARCHAR(5) PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('fisik', 'non-fisik')),
  status TEXT NOT NULL DEFAULT 'terbit' CHECK (status IN ('terbit', 'checkin', 'menang', 'diklaim')),
  transaction_id TEXT NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checkin_at TIMESTAMPTZ,
  won_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  prize_id TEXT,
  prize_name TEXT
);

-- Indexing untuk kecepatan query pos check-in & undian
CREATE INDEX IF NOT EXISTS idx_vouchers_transaction ON public.vouchers(transaction_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON public.vouchers(status);

-- 3. Tabel Hadiah (Prizes)
CREATE TABLE IF NOT EXISTS public.prizes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  stock INT NOT NULL DEFAULT 1,
  drawn_count INT NOT NULL DEFAULT 0,
  order_num INT NOT NULL DEFAULT 1,
  icon TEXT
);

-- 4. Tabel Hasil Undian (Draw Results)
CREATE TABLE IF NOT EXISTS public.draw_results (
  id TEXT PRIMARY KEY,
  voucher_code VARCHAR(5) NOT NULL,
  prize_id TEXT NOT NULL,
  prize_name TEXT NOT NULL,
  drawn_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed BOOLEAN NOT NULL DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  verifier_pin TEXT
);

-- 5. Seeding Data Hadiah Awal
INSERT INTO public.prizes (id, name, stock, drawn_count, order_num, icon) VALUES
  ('p1', 'Kipas Angin Stand Fan', 5, 0, 1, 'Wind'),
  ('p2', 'Kompor Gas 2 Tungku', 3, 0, 2, 'Flame'),
  ('p3', 'Rice Cooker Digital', 3, 0, 3, 'Utensils'),
  ('p4', 'TV LED 32 Inch', 2, 0, 4, 'Tv'),
  ('p5', 'Sepeda Gunung MTB', 2, 0, 5, 'Bike'),
  ('p6', 'Hadiah Utama: Sepeda Motor', 1, 0, 6, 'Trophy')
ON CONFLICT (id) DO NOTHING;

-- 6. Enable Row Level Security (RLS) & Public Policies for Anon Access
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write vouchers" ON public.vouchers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write prizes" ON public.prizes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write draw_results" ON public.draw_results FOR ALL USING (true) WITH CHECK (true);

-- 7. Aktifkan Supabase Realtime untuk Sync Multi-HP Panitia
ALTER PUBLICATION supabase_realtime ADD TABLE public.vouchers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.draw_results;

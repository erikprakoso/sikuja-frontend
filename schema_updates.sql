-- ========================================================
-- SIKUJA Database Migration — Update
-- Salin dan jalankan di SQL Editor Supabase Dashboard
-- ========================================================

-- 1. Kolom metode pembayaran di tabel transactions
--    ('cash' untuk tunai, 'qris' untuk scan QRIS, 'free' untuk kupon donasi gratis)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash';

-- 1b. Perbarui constraint agar menerima metode 'free' (kupon gratis untuk donatur).
ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_payment_method_check;
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_payment_method_check
  CHECK (payment_method IN ('cash', 'qris', 'free'));

-- 2. Kode voucher 5-digit sudah dijamin unik (PRIMARY KEY di kolom code).
--    Jika tabel dibuat sebelum schema.sql, pastikan juga dengan:
--    ALTER TABLE public.vouchers ADD CONSTRAINT vouchers_pkey PRIMARY KEY (code);

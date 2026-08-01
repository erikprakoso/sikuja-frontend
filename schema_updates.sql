-- ========================================================
-- SIKUJA Database Migration — Update
-- Salin dan jalankan di SQL Editor Supabase Dashboard
-- ========================================================

-- 1. Kolom metode pembayaran di tabel transactions
--    ('cash' untuk tunai, 'qris' untuk scan QRIS)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash'
  CHECK (payment_method IN ('cash', 'qris'));

-- 2. Kode voucher 5-digit sudah dijamin unik (PRIMARY KEY di kolom code).
--    Jika tabel dibuat sebelum schema.sql, pastikan juga dengan:
--    ALTER TABLE public.vouchers ADD CONSTRAINT vouchers_pkey PRIMARY KEY (code);

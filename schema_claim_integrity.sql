-- ========================================================
-- SIKUJA — Migrasi: Integritas Klaim & Perbaikan Nama Kolom
-- Salin & jalankan di SQL Editor Supabase (satu kali).
-- ========================================================

-- 1. Rename kolom verifier_pin → verifier_name (lebih deskriptif).
--    Field ini menyimpan nama verifikator yang memproses klaim, bukan PIN.
ALTER TABLE public.draw_results
  RENAME COLUMN verifier_pin TO verifier_name;

-- 2. Tambah kolom customer_name ke draw_results untuk tampilan panggung.
--    Diisi saat konfirmasi pemenang (ambil dari vouchers JOIN transactions).
ALTER TABLE public.draw_results
  ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- 3. Backfill customer_name untuk data yang sudah ada (jika ada).
--    Join draw_results → vouchers → transactions untuk ambil nama pembeli.
UPDATE public.draw_results dr
SET customer_name = t.customer_name
FROM public.vouchers v
JOIN public.transactions t ON t.id = v.transaction_id
WHERE dr.voucher_code = v.code
  AND dr.customer_name IS NULL;

-- ========================================================
-- SIKUJA — Migrasi: PIN Unik per Petugas (Tabel Users)
-- Salin & jalankan di SQL Editor Supabase (satu kali).
-- ========================================================

-- 1. Tabel Petugas (Users)
-- PIN tidak pernah disimpan plaintext: hanya scrypt hash + salt.
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('penjual','pos','mc','verifikator','admin')),
  pin_salt TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Aktifkan RLS. TANPA policy apapun = anon/public TIDAK bisa akses tabel ini.
--    Hanya service role (server) yang bisa baca/tulis lewat bypass RLS.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Kolom audit (siapa yang mengerjakan operasi tulis)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS checkin_by TEXT;
ALTER TABLE public.draw_results ADD COLUMN IF NOT EXISTS created_by TEXT;

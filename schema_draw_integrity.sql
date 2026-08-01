-- ========================================================
-- SIKUJA — Migrasi: Integritas Undian yang Adil
-- Salin & jalankan di SQL Editor Supabase (satu kali).
-- ========================================================

-- 1. Tabel kandidat undian yang sedang menunggu konfirmasi MC.
--    Draw HANYA "mencatat" kandidat; konfirmasi/gugur WAJIB mengacu ke tabel
--    ini sehingga kode yang dikonfirmasi pasti kode yang benar-benar tampil
--    di layar proyektor (mencegah konfirmasi kode lain / rigging).
CREATE TABLE IF NOT EXISTS public.pending_draws (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  prize_id TEXT NOT NULL REFERENCES public.prizes(id) ON DELETE CASCADE,
  voucher_code VARCHAR(5) NOT NULL REFERENCES public.vouchers(code) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'forfeited')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT
);

-- Index untuk mengambil kandidat TERBARU per hadiah dengan cepat.
CREATE INDEX IF NOT EXISTS idx_pending_draws_prize_pending
  ON public.pending_draws (prize_id, status, created_at DESC)
  WHERE status = 'pending';

-- 2. Cegah duplikat: satu kode voucher hanya boleh tercatat menang satu kali.
--    Catatan: jika sudah ada baris ganda di draw_results, migration ini akan
--    gagal. Hapus/rapikan duplikatnya terlebih dahulu, lalu jalankan lagi.
ALTER TABLE public.draw_results
  DROP CONSTRAINT IF EXISTS draw_results_voucher_code_unique;
ALTER TABLE public.draw_results
  ADD CONSTRAINT draw_results_voucher_code_unique UNIQUE (voucher_code);

-- 3. RLS: tanpa policy apapun, anon/public TIDAK bisa mengakses tabel ini.
--    Hanya service role (server) yang boleh baca/tulis (bypass RLS).
ALTER TABLE public.pending_draws ENABLE ROW LEVEL SECURITY;

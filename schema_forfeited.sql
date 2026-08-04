-- ========================================================
-- SIKUJA Database Migration — Status Voucher 'forfeited'
-- Kupon yang digugurkan ("Gugurkan & Undi Ulang") dianggap HANGUS
-- dan tidak akan pernah masuk pool undian lagi.
-- Salin dan jalankan di SQL Editor Supabase Dashboard.
-- ========================================================

ALTER TABLE public.vouchers
  DROP CONSTRAINT IF EXISTS vouchers_status_check;

ALTER TABLE public.vouchers
  ADD CONSTRAINT vouchers_status_check
  CHECK (status IN ('terbit', 'checkin', 'menang', 'diklaim', 'forfeited'));

-- ========================================================
-- SIKUJA — Migrasi: RPC Atomik Pembelian (Anti Overspend Concurrent)
-- Salin & jalankan di SQL Editor Supabase SETELAH schema_keuangan.sql.
-- Menjalankan cek saldo + insert/update pembelian dalam SATU transaksi
-- sehingga dua admin yang menyimpan bersamaan tidak bisa overspend.
-- ========================================================

CREATE OR REPLACE FUNCTION public.upsert_purchase(
  p_id TEXT,
  p_item_name TEXT,
  p_qty INT,
  p_price_per_unit INT,
  p_is_doorprize BOOLEAN,
  p_funding_source TEXT,
  p_note TEXT,
  p_created_by TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_price INT := p_qty * p_price_per_unit;
  v_total_donasi INT;
  v_spent_donasi INT;
  v_spent_kupon INT;
  v_voucher_sales INT;
  v_available INT;
  v_row public.purchases%ROWTYPE;
  v_source_label TEXT;
BEGIN
  IF p_qty <= 0 OR p_price_per_unit < 0 THEN
    RAISE EXCEPTION 'Jumlah harus angka positif dan harga non-negatif';
  END IF;

  -- Saldo masuk: total donasi & total penjualan kupon (sum transactions.total_harga)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_donasi FROM public.donations;
  SELECT COALESCE(SUM(total_harga), 0) INTO v_voucher_sales FROM public.transactions;

  -- Belanja terpakai (exclude item yang sedang diedit, bila ada)
  SELECT COALESCE(SUM(total_price), 0) INTO v_spent_donasi
  FROM public.purchases
  WHERE COALESCE(funding_source, 'donasi') <> 'penjualan_kupon'
    AND (p_id IS NULL OR id <> p_id);

  SELECT COALESCE(SUM(total_price), 0) INTO v_spent_kupon
  FROM public.purchases
  WHERE COALESCE(funding_source, 'donasi') = 'penjualan_kupon'
    AND (p_id IS NULL OR id <> p_id);

  IF p_funding_source = 'penjualan_kupon' THEN
    v_available := v_voucher_sales - v_spent_kupon;
    v_source_label := 'Hasil Penjualan Kupon';
  ELSE
    v_available := v_total_donasi - v_spent_donasi;
    v_source_label := 'Donasi & Sponsor';
  END IF;

  IF v_total_price > v_available THEN
    RAISE EXCEPTION 'Saldo kas % tidak mencukupi. Sisa Saldo: Rp%, Total Belanja: Rp%',
      v_source_label, GREATEST(v_available, 0), v_total_price;
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.purchases
      (item_name, qty, price_per_unit, total_price, purchase_date,
       is_doorprize, funding_source, note, created_by)
    VALUES
      (p_item_name, p_qty, p_price_per_unit, v_total_price, CURRENT_DATE,
       p_is_doorprize, p_funding_source, p_note, p_created_by)
    RETURNING * INTO v_row;
  ELSE
    UPDATE public.purchases SET
      item_name = p_item_name,
      qty = p_qty,
      price_per_unit = p_price_per_unit,
      total_price = v_total_price,
      purchase_date = CURRENT_DATE,
      is_doorprize = p_is_doorprize,
      funding_source = p_funding_source,
      note = p_note,
      created_by = p_created_by
    WHERE id = p_id
    RETURNING * INTO v_row;

    IF v_row.id IS NULL THEN
      RAISE EXCEPTION 'Pembelian tidak ditemukan (id %)', p_id;
    END IF;
  END IF;

  RETURN to_jsonb(v_row);
END;
$$;

-- Izin eksekusi (default: public dapat execute; batasi ke authenticated bila perlu)
REVOKE ALL ON FUNCTION public.upsert_purchase(TEXT, TEXT, INT, INT, BOOLEAN, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_purchase(TEXT, TEXT, INT, INT, BOOLEAN, TEXT, TEXT, TEXT) TO authenticated;

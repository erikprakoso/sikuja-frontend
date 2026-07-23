# Tech Stack: SIKUJA — Sistem Kupon & Undian Jalan Sehat

Dokumen ini adalah rekomendasi teknologi untuk implementasi SIVOJA, terpisah dari PRD (lihat `prd.md`).

## 1. Frontend (Web App)

- **Next.js (React / App Router)** — satu codebase untuk semua peran: meja penjualan, halaman e-voucher peserta, pos check-in, layar undian, dashboard admin.
- **PWA (Progressive Web App)** — agar panitia bisa "add to home screen" di HP, terasa seperti aplikasi tanpa perlu install dari app store.
- **Tailwind CSS** — styling cepat, tampilan simpel & mudah dibaca untuk panitia non-teknis.

## 2. Backend & Database

- **Supabase (Postgres)** — database utama, dengan tabel inti:
  - `transactions` — transaksi pembelian (ID, token acak, tipe, jumlah voucher, timestamp).
  - `vouchers` — kode (5 digit angka), tipe (fisik/non-fisik), status (terbit/checkin/menang/diklaim), transaction_id, waktu terbit.
  - `hadiah` — nama hadiah, jumlah/stok, urutan pengundian.
  - `hasil_undian` — kode pemenang, hadiah_id, waktu klaim, panitia_id.
  - `checkin_pos` — kode voucher, waktu scan, panitia_id/HP.
- **Supabase Realtime** — sinkronisasi langsung antar beberapa HP panitia yang scan paralel di pos check-in dan layar undian.
- **PIN-based Authentication** — login panitia menggunakan PIN 4-digit sesuai peran (Penjual, Pos Check-in, MC Undian, Verifikator Panggung, Admin).
- **Supabase Row Level Security (RLS)** — batasi hak akses mutasi data berdasarkan role panitia.

## 3. Offline Resilience & Storage

- **IndexedDB / LocalForage Queue** — di pos check-in, jika koneksi internet terputus, data scan disimpan sementara di HP panitia dan otomatis disinkronkan ke Supabase begitu sinyal kembali.

## 4. QR Code & Scanner

- **Generate QR**: library `qrcode` (npm) — generate QR transaksi voucher non-fisik (URL token unik `sivoja.app/v/[token]`).
- **Scan QR**: library `html5-qrcode` — akses kamera HP langsung dari browser (tanpa app tambahan), dipakai di pos check-in dan verifikasi panggung.

## 5. Pencatatan Voucher Fisik

- Tanpa cetak printer di lokasi. Sistem menerbitkan kode 5-digit angka murni dari pool global yang langsung tampil di layar penanganan kasir/penjual untuk disalin ke kupon/kertas fisik.

## 6. Layar Undian & Sound Effects

- Halaman web khusus mode "layar besar" (proyektor/TV).
- Animasi kocokan angka acak menggunakan `Framer Motion` / CSS transitions.
- Sound Effects: Web Audio API / HTML5 Audio untuk suara drumroll, slot spin, dan suara *fanfare* kemenangan.

## 7. Hosting & Deployment

- **Vercel** — hosting untuk Next.js, terhubung langsung ke Supabase sebagai backend.

## 8. Ringkasan Tabel

| Kebutuhan | Teknologi |
|---|---|
| Frontend web app | Next.js + Tailwind CSS |
| Mode instalasi | PWA |
| Database & backend | Supabase (Postgres) |
| Offline Queue (Pos) | IndexedDB / LocalForage |
| Sinkronisasi realtime | Supabase Realtime |
| Autentikasi panitia | PIN-based per role |
| Keamanan akses data | Supabase RLS |
| Generate QR | qrcode (npm) |
| Scan QR | html5-qrcode |
| Layar undian | Next.js + Framer Motion + Web Audio API (SFX) |
| Hosting | Vercel |
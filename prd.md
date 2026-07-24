# PRD: SIKUJA — Sistem Kupon & Undian Jalan Sehat (Agustusan)

## 1. Latar Belakang

Setiap acara Agustusan, panitia mengadakan jalan sehat dengan sistem voucher undian sebagai berikut (proses lama/manual):

1. Setiap orang membeli voucher fisik seharga Rp5.000/lembar, bebas beli berapa saja.
2. Setiap voucher punya kode unik (misal 5 digit angka), biasanya dicetak rangkap: satu lembar dipegang peserta, satu lembar (kupon kembar/kode sama) masuk ke kotak/kocokan panitia.
3. Saat sesi undian jalan sehat, panitia mengocok kotak berisi lembar kode, mengambil satu lembar secara acak, lalu menyebutkan kodenya lewat pengeras suara.
4. Peserta yang memegang voucher dengan kode sama maju ke panggung membawa vouchernya untuk mengambil hadiah.
5. Voucher yang menang disobek di tempat sebagai bukti sudah "dipakai"/tidak bisa dipakai lagi untuk klaim hadiah lain.

Proses ini rawan masalah: kode ganda/duplikat saat penulisan manual, kocokan tidak benar-benar acak/terlihat tidak adil, antrian lambat saat verifikasi kode, rekap penjualan & hadiah tercatat manual di kertas, serta risiko voucher hilang/rusak/dipalsukan.

## 2. Tujuan

Menggantikan proses manual di atas dengan sistem digital yang:

- Menjamin setiap kode voucher unik dan tercatat otomatis.
- Membuat proses pengocokan/undian transparan, adil, dan bisa disaksikan (auditable).
- Mempercepat verifikasi "siapa pemilik kode ini" saat pemenang dipanggil.
- Mencegah satu kode dipakai klaim hadiah lebih dari sekali (pengganti "sobek kertas").
- Menyediakan rekap otomatis: jumlah voucher terjual, total dana terkumpul, daftar pemenang & hadiah.

## 3. Ruang Lingkup

### 3.1 Termasuk (In Scope)
- Penerbitan voucher dengan kode unik per lembar, tersedia dalam **dua bentuk sekaligus**:
  - **Voucher fisik** (kertas tercetak, kode + opsional QR) — untuk peserta yang tidak familiar dengan HP/aplikasi (gaptek).
  - **Voucher non-fisik** (e-voucher digital, ditunjukkan lewat HP) — untuk peserta yang terbiasa pakai HP.
  - Kode voucher fisik dan non-fisik berasal dari **satu pool kode yang sama**, sehingga dijamin tidak ada kode yang sama antara voucher fisik dan non-fisik.
- Pencatatan penjualan voucher secara anonim (tanpa nama/kontak pembeli) — cukup jumlah lembar & tipe (fisik/non-fisik) per transaksi.
- Modul pengocokan/undian acak dari seluruh kode yang terjual, ditayangkan di layar agar peserta bisa melihat langsung.
- Modul verifikasi/klaim hadiah: scan atau input kode pemenang, sistem menandai kode tersebut "sudah dipakai" (pengganti sobek voucher) sehingga tidak bisa diundi/diklaim ulang.
- Dashboard panitia: rekap penjualan, daftar hadiah, daftar pemenang, status kode (belum ditarik/sudah ditarik/sudah diklaim).
- Fitur **Cetak Kupon Fisik & Struk Thermal**: mendukung pencetakan langsung dari browser ke Printer Thermal Bluetooth (58mm/80mm) atau printer biasa, berisi kode 5-digit besar & QR code untuk dibawa peserta pada hari-H.

### 3.2 Tidak Termasuk (Out of Scope) — tahap awal
- Pembayaran online/e-wallet (asumsi pembelian voucher tetap tunai di lokasi, sistem hanya mencatat).
- Notifikasi WhatsApp/SMS otomatis ke pemenang.
- Integrasi dengan sistem lain di luar acara ini.

## 4. Peran Pengguna (User Roles)

| Peran | Deskripsi |
|---|---|
| **Panitia Penjual** | Menginput/menerbitkan voucher saat peserta membeli, mencetak kode voucher. |
| **Panitia Undian (MC/Operator)** | Menjalankan proses kocok undian di depan layar, menampilkan hasil kode terpilih. |
| **Panitia Verifikasi Panggung** | Memindai/menginput kode voucher peserta yang maju ke panggung, menandai hadiah terklaim. |
| **Panitia Admin/Ketua** | Melihat dashboard rekap, mengelola daftar hadiah, mengunduh laporan akhir. |
| **Peserta** | Membeli voucher, memegang bukti fisik (kertas/QR) berisi kode. |

## 5. Alur Proses (User Flow)

### 5.1 Penjualan Voucher
1. Peserta datang ke meja penjualan, bayar Rp5.000/lembar (atau nominal lain yang diatur).
2. Panitia bertanya/menawarkan tipe voucher: **fisik** (dicetak) atau **non-fisik** (e-voucher).
3. Panitia input jumlah lembar yang dibeli ke sistem (boleh campur, sebagian fisik sebagian non-fisik dalam satu transaksi — misalnya 1 orang beli 10 voucher, 4 fisik + 6 non-fisik).
4. Sistem generate kode unik acak (5 digit) dari satu pool global, sehingga kode fisik dan non-fisik dijamin tidak pernah sama.
5. Untuk voucher fisik → sistem cetak kertas voucher (kode besar + opsional QR) untuk dipegang peserta.
6. Untuk voucher non-fisik → **tidak perlu print, tidak perlu kirim WA/SMS**. Caranya: layar/tablet di meja penjualan menampilkan **1 QR per transaksi** (bukan per voucher), lalu peserta cukup **scan sekali** pakai kamera HP (buka browser biasa, tanpa install aplikasi, tanpa login). Setelah discan, terbuka halaman berisi **semua kode voucher non-fisik dari transaksi itu sekaligus** (misal 1 transaksi beli 6 lembar → halaman menampilkan 6 kode + QR masing-masing dalam satu tampilan). Halaman ini yang jadi "e-voucher" mereka, disimpan sebagai link/bookmark, dipakai lagi saat check-in di pos maupun saat undian.
   - Dengan cara ini, berapa pun jumlah voucher non-fisik yang dibeli dalam satu transaksi, peserta tetap **hanya scan 1 kali** — jauh lebih cepat dibanding scan satu-satu saat antrian ramai.
7. Seluruh kode (fisik maupun non-fisik) otomatis masuk ke database sebagai "kode ikut undian" — tidak ada lagi kertas kembar yang harus dimasukkan ke kotak kocokan secara manual.
8. Karena pencatatan bersifat anonim, sistem **tidak** menyimpan nama/kontak pembeli — siapapun yang memegang bukti voucher (kertas atau tampilan e-voucher di HP) berhak klaim jika kodenya ditarik.

### 5.2 Check-in di Pos (Wajib, Syarat Sah Ikut Undian)
1. Ada **1 pos check-in**, ditempatkan di **tengah rute** jalan sehat (bukan di start/finish) agar peserta tetap menyelesaikan sebagian rute sebelum bisa check-in, dan agar tidak menumpuk di titik keberangkatan/kedatangan.
2. Di pos ini, **beberapa panitia scan sekaligus secara paralel** menggunakan HP masing-masing (misal 4 panitia = 4 titik scan aktif berbarengan di lokasi yang sama) — supaya antrian tetap cepat mengalir walau peserta datang bergerombol.
3. Peserta yang lewat pos menunjukkan buktinya ke salah satu panitia yang scan:
   - **Voucher fisik** → di-scan QR di kertasnya (tetap dipegang peserta, belum disobek di tahap ini — sobek baru terjadi saat menang di panggung).
   - **Voucher non-fisik** → tunjukkan halaman e-voucher di HP (berisi satu atau beberapa kode dari transaksinya) untuk discan, kode per kode.
4. Sistem menandai kode tersebut berstatus **"sudah check-in"**, dan seluruh scan dari HP panitia manapun langsung tersinkron ke satu database yang sama (real-time), jadi kode yang sama tidak bisa "ke-scan dobel" di dua HP panitia berbeda secara bersamaan.
5. Kode yang **belum check-in tidak akan ikut ditarik saat undian** — ini jadi syarat wajib, bukan sekadar data partisipasi.
6. Kalau peserta punya banyak kode voucher tapi hanya sebagian yang dibawa/discan di pos, hanya kode yang sudah check-in yang eligible ikut undian; kode yang tidak dibawa/tidak discan otomatis tidak diikutkan.

### 5.3 Sesi Undian (Hari-H)
1. Operator membuka layar undian di depan peserta.
2. Operator menekan tombol "Kocok/Tarik Kode" — sistem memilih satu kode secara acak dari seluruh kode yang **berstatus valid, sudah check-in di pos, dan belum menang**.
3. Kode ditampilkan besar di layar + dibacakan MC.
4. Peserta pemilik kode maju ke panggung membawa **bukti kode tersebut** — bisa berupa lembar voucher fisik, atau menunjukkan e-voucher di layar HP (untuk yang non-fisik).
5. Panitia verifikasi memindai/menginput kode voucher peserta tersebut untuk mencocokkan dengan kode yang tampil di layar.
   - Jika cocok → sistem menandai **kode itu saja** (bukan orangnya) sebagai **"sudah menang & diklaim"** (pengganti aksi sobek kertas), hadiah dicatat, kode tersebut tidak akan pernah muncul lagi di undian berikutnya.
   - Voucher/kode lain milik orang yang sama (jika ia beli banyak voucher) **tetap aktif** dan tetap punya kesempatan menang lagi di undian berikutnya — karena kemenangan berlaku per kode, bukan per orang. Contoh: seseorang punya 10 voucher, salah satu kodenya ditarik dan menang, maka 9 kode sisanya tetap ikut undian selanjutnya.
   - Jika tidak cocok / peserta tidak hadir dalam waktu tertentu → operator bisa "Tarik Ulang" untuk kocok kode baru.
6. Ulangi untuk tiap hadiah yang tersedia.

### 5.4 Pasca Acara
- Admin mengunduh laporan: total voucher terjual, total dana, daftar lengkap pemenang & hadiah yang didapat.

## 6. Fitur Utama

1. **Generator Kode Unik (Satu Pool Global)** — memastikan tidak ada kode ganda selama seluruh proses penerbitan, baik untuk voucher fisik maupun non-fisik.
2. **Cetak Voucher Fisik** — layout sederhana siap cetak (kode + QR opsional), bisa banyak lembar sekaligus.
3. **Serah-Terima E-Voucher via 1 QR per Transaksi** — di meja penjualan, layar/tablet menampilkan satu QR untuk seluruh transaksi (berapapun jumlah vouchernya), peserta scan sekali dengan kamera HP sendiri untuk membuka halaman berisi semua kode e-voucher miliknya (tanpa install aplikasi, tanpa login, tanpa cetak) — jauh lebih cepat dibanding scan satu-satu.
4. **Check-in di Pos (Wajib, Multi-Scanner)** — 1 titik di tengah rute, dengan beberapa panitia scan paralel pakai HP masing-masing (data tersinkron real-time ke satu database agar tidak ada scan dobel). Kode yang belum check-in di pos ini **tidak eligible** ikut ditarik saat undian.
4. **Mesin Pengocokan Acak (Random Draw)** — mengambil 1 kode acak dari seluruh kode (fisik + non-fisik) yang statusnya belum menang, dengan tampilan layar besar (untuk proyektor) yang menampilkan animasi kocokan dan hasil kode.
5. **Verifikasi & Klaim Hadiah per Kode** — input/scan kode (dari kertas atau layar HP), cocokkan dengan kode hasil undian, tandai **kode tersebut** berstatus "diklaim" agar tidak muncul lagi di undian berikutnya. Kode-kode lain milik pemegang yang sama tetap aktif dan tetap ikut undian selanjutnya.
6. **Manajemen Daftar Hadiah** — panitia input daftar hadiah (nama hadiah, jumlah) sebelum acara, sistem otomatis mencocokkan urutan/pengundian dengan daftar hadiah yang tersisa.
7. **Dashboard Rekap** — total voucher terjual (dipecah fisik/non-fisik), total dana, daftar pemenang real-time (hanya kode, tanpa nama — sesuai prinsip anonim), status tiap kode (aktif/menang/diklaim).
8. **Mode Offline-Friendly (opsional, disarankan)** — mengingat lokasi outdoor bisa sinyal internet lemah, sistem sebaiknya bisa tetap jalan di jaringan lokal (WiFi lokal/hotspot panitia) tanpa bergantung internet.

## 7. Model Data (Ringkas)

**Voucher**
- kode (5 digit, unik lintas seluruh voucher fisik & non-fisik)
- tipe: `fisik` / `non-fisik`
- status: `terbit` → `diundi/menang` → `diklaim`
- waktu terbit
- (tidak ada field nama/kontak pembeli — sistem anonim by design)

**Hadiah**
- nama hadiah
- jumlah/stok
- urutan pengundian (opsional: hadiah besar di undi terakhir)

**Hasil Undian**
- kode pemenang
- hadiah yang didapat
- waktu klaim
- panitia yang memverifikasi

**Check-in Pos** (wajib, syarat sah ikut undian)
- kode voucher
- waktu scan
- HP/panitia mana yang scan (1 pos, beberapa alat scan paralel)

## 8. Kebutuhan Non-Fungsional

- **Adil & transparan**: proses acak harus benar-benar random dan hasilnya langsung terlihat oleh semua peserta di layar (tidak ada ruang kecurigaan "settingan").
- **Cepat**: verifikasi kode di panggung harus di bawah beberapa detik agar acara tidak molor.
- **Sinkron real-time antar alat scan**: karena di pos check-in ada beberapa HP panitia scan bersamaan, status "sudah check-in" harus langsung tersinkron ke semua alat agar tidak ada kode yang ke-scan dobel dari dua HP berbeda dalam waktu hampir bersamaan.
- **Tahan gangguan jaringan**: karena acara outdoor, disarankan aplikasi web sederhana yang jalan di jaringan lokal/hotspot, atau minimal punya mode offline sementara.
- **Mudah dipakai panitia non-teknis**: antarmuka sederhana, karena yang menjalankan adalah panitia acara, bukan tim IT.
- **Perangkat**: laptop/HP untuk penjualan & undian, beberapa HP panitia untuk scan paralel di pos check-in, printer kasir/label untuk cetak voucher fisik, dan proyektor/TV untuk layar undian.

## 9. Metrik Keberhasilan

- 0 kasus kode voucher duplikat.
- 0 kasus satu kode menang/diklaim lebih dari sekali.
- Waktu rata-rata verifikasi pemenang di panggung < 15 detik.
- Laporan rekap penjualan & pemenang tersedia otomatis tanpa rekap manual ulang.

## 10. Keputusan yang Sudah Dikonfirmasi

- **Tipe voucher**: fisik dan non-fisik berjalan berdampingan. Fisik untuk peserta yang gaptek, non-fisik (e-voucher) untuk yang terbiasa HP. Kode keduanya wajib berasal dari satu pool unik yang sama — tidak boleh ada kode fisik dan non-fisik yang kembar.
- **Aturan menang**: kemenangan berlaku per kode voucher, bukan per orang. Satu orang boleh punya banyak voucher; jika salah satu kodenya menang, kode-kode lain miliknya tetap aktif dan tetap ikut undian berikutnya.
- **Data pembeli**: sistem anonim total, tidak mencatat nama/no. HP pembeli — sengaja dibuat begitu supaya pemenang tetap jadi kejutan sampai orangnya maju ke panggung.
- **Serah-terima e-voucher**: tanpa cetak, tanpa kirim WA/SMS. Untuk mempercepat antrian, sistem pakai **1 QR per transaksi** (bukan per voucher) — peserta scan sekali pakai kamera HP sendiri, langsung muncul halaman berisi semua kode e-voucher dari transaksi tersebut.
- **Check-in di pos**: hanya **1 pos**, ditempatkan di **tengah rute** jalan sehat, sifatnya **wajib** — kode yang tidak check-in di pos ini otomatis tidak eligible ikut ditarik saat undian. Untuk antisipasi antrian, pos ini dilayani **beberapa panitia scan sekaligus secara paralel** (masing-masing pakai HP sendiri, data tersinkron real-time).
- **Harga**: sama, Rp5.000/voucher untuk fisik maupun non-fisik.

PRD ini sudah mencakup seluruh keputusan yang dikonfirmasi panitia. Detail teknis implementasi (pilihan platform/tech stack, desain tampilan, dll.) bisa dibahas di tahap berikutnya setelah PRD ini disepakati.

## 12. Rekomendasi Teknologi

- **Bentuk aplikasi**: satu **web app** (bukan aplikasi mobile terpisah), diakses lewat browser di laptop/tablet/HP oleh panitia maupun peserta — tanpa perlu install apapun. Bisa dibuat sebagai **PWA** agar panitia bisa "add to home screen" jika mau terasa seperti aplikasi.
- **Backend & database**: **Supabase** — dipakai untuk:
  - Database utama (data voucher, hadiah, hasil undian, check-in pos).
  - **Realtime sync** antar beberapa HP panitia yang scan bersamaan di pos check-in, supaya status "sudah check-in" langsung ter-update di semua alat dan tidak ada scan dobel.
  - Auth (opsional) untuk membedakan akses panitia penjual, panitia verifikasi panggung, panitia pos check-in, dan admin.
- **Scan QR**: pakai library QR scanner berbasis browser (mengakses kamera HP langsung dari web, tanpa app tambahan) — dipakai di meja penjualan (buka e-voucher), pos check-in, dan verifikasi panggung.
- **Hosting**: web app di-deploy terpisah dari Supabase (misalnya di layanan hosting statis/serverless), terhubung ke Supabase sebagai backend.
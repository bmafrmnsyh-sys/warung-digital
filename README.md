# WARUNG DIGITAL

Aplikasi Kasir dan Manajemen Warung Kelontong Profesional berbasis React, Tailwind CSS, dan LocalStorage / Supabase Ready.

## Cara Menjalankan di Laptop:

1. Pastikan **Node.js** sudah terinstal di komputer/laptop Anda (download di [nodejs.org](https://nodejs.org/)).
2. Ekstrak file ZIP ini ke folder pilihan Anda.
3. Buka terminal / command prompt pada folder tersebut.
4. Jalankan perintah instalasi dependency:
   ```bash
   npm install
   ```
5. Jalankan mode development:
   ```bash
   npm run dev
   ```
6. Buka link localhost yang muncul di browser (biasanya `http://localhost:5173`).

## Fitur Utama:
- **Logo Resmi**: Ikon keranjang hijau minimalis yang elegan.
- **Dashboard Interaktif**: Omzet hari ini, laba kotor, laba bersih, grafik penjualan, metode pembayaran (Cash, QRIS, Transfer, Utang).
- **Kasir (POS)**: Scan barcode, keranjang belanja, diskon, hitung kembalian otomatis, cetak struk thermal 58mm/80mm.
- **Buku Utang Digital**: Catat piutang pelanggan, nomor WhatsApp, riwayat cicilan, dan status lunas.
- **Manajemen Stok Otomatis**: Stok berkurang otomatis saat terjual, bertambah saat pembelian supplier, notifikasi stok menipis.
- **Data Produk & Harga**: Harga kulak, harga jual, margin laba otomatis.
- **Laporan & Keuangan**: Laporan harian/bulanan/tahunan, pencatatan biaya operasional (listrik, transport, dll), ekspor Excel/CSV.
- **Cetak Barcode & Label Harga**: Code-128 generator siap cetak.
- **Pengaturan & Backup**: Ubah profil warung, backup & restore database JSON.

# CampusQueue

Aplikasi antrean layanan kampus berbasis Expo/React Native (SDK 58) untuk Android, dengan server demo Node.js (middleware json-server). Aplikasi dan API berada dalam satu repositori.

Tampilan mengikuti desain Figma CampusQueue (gaya kaca/glassmorphism, font Inter): login, beranda, ambil antrean, antrean saya, tiket, riwayat, profil, kontrol loket dan daftar antrean petugas, serta kelola, loket & petugas, dan statistik admin.

## Cara cepat

```powershell
git clone https://github.com/naenalie/MAD_FINALPROJECT.git
cd MAD_FINALPROJECT
npm install        # sekali saja setelah clone
```

Lalu buka dua terminal di folder proyek:

```powershell
npm run api        # terminal 1: server API
npm start          # terminal 2: tekan a untuk membuka di Android Emulator
```

Tidak perlu membuat `.env` untuk emulator; aplikasi otomatis memakai `http://10.0.2.2:3000`. Masuk dengan akun demo di bawah. Detail lengkap ada di bagian berikut.

## Prasyarat

- **Git** dan **Node.js 22.13+ atau 24.3+** (LTS) beserta npm — React Native 0.88/Expo 58 tidak berjalan di Node 20. Cek dengan `node --version`, `npm --version`, `git --version`.
- **Android Studio** dengan Android SDK dan sebuah virtual device (Device Manager), **atau** ponsel Android.
- **Expo Go untuk SDK 58** di emulator/ponsel. Saat pertama kali menekan `a`, Expo memasangnya otomatis di emulator.

Semua dependensi (termasuk font Inter, ikon, dan gradien) terpasang lewat `npm ci`; tidak ada langkah tambahan.

## Menjalankan (detail)

Setelah clone, pasang dependensi sekali dengan `npm install` (atau `npm ci` untuk versi persis dari lockfile). File `.env` opsional — hanya perlu untuk ponsel fisik (lihat tabel di bawah); salin dari `.env.example` bila diperlukan.

Terminal 1 — server API (port 3000):

```powershell
npm run api
```

Buka `http://localhost:3000/health` di browser untuk memastikan server hidup.

Terminal 2 — aplikasi. Jalankan emulator Android dulu dari Android Studio > Device Manager, lalu:

```powershell
npm start
```

Tekan `a` untuk membuka di emulator Android. Setelah mengubah `.env`, mulai ulang dengan `npx expo start --clear`.

### Alamat server (`.env`)

| Target | `EXPO_PUBLIC_API_URL` |
| --- | --- |
| Android Emulator (bawaan `.env.example`) | `http://10.0.2.2:3000` |
| Preview web (`npm run web`) | tidak perlu diubah: `10.0.2.2` otomatis diganti `localhost` di web |
| Ponsel fisik | `http://ALAMAT_IPV4_KOMPUTER:3000` (lihat `ipconfig`) |

`localhost` di emulator berarti emulator itu sendiri, karena itu emulator memakai `10.0.2.2` untuk mencapai komputer. Untuk ponsel fisik, sambungkan ponsel dan komputer ke jaringan yang sama dan izinkan port 3000 di Windows Firewall untuk jaringan tepercaya.

### Jika ada kendala

- **"Tidak dapat terhubung ke server"**: pastikan `npm run api` masih berjalan dan alamat `.env` sesuai tabel di atas.
- **Port 8081 dipakai**: jalankan `npx expo start --port 8082`.
- **Emulator gagal start karena disk penuh**: emulator butuh beberapa GB ruang kosong di drive tempat AVD disimpan. Hapus snapshot di Device Manager atau cache yang bisa dibuat ulang (mis. `npm cache clean --force`).
- **Tampilan lama/tidak berubah**: `npx expo start --clear`.

## Akun demo

Semua password adalah `demo123`. Di layar login, memilih peran (Mahasiswa/Petugas/Admin) mengisi email demo secara otomatis.

| Role | Email |
| --- | --- |
| User | user@campusqueue.test |
| Petugas | petugas@campusqueue.test |
| Admin | admin@campusqueue.test |
| User kedua | rani@campusqueue.test |

## Struktur

- `src/app/` — route Expo Router (`[tab].tsx` memilih layar sesuai peran).
- `src/components/` — `ui.tsx` (komponen dasar), `Login.tsx`, `UserScreens.tsx`, `StaffScreens.tsx`, `Manage.tsx` (admin).
- `src/theme.ts` — warna, font, dan gradien dari Figma.
- `assets/figma/` — latar dan orb yang diekspor dari Figma.
- `backend/` — server API dan data awal.

## Aturan dan asumsi

Event diperlakukan sebagai layanan yang dapat dibuka, dijeda, atau ditutup; petugas hanya mengendalikan loket yang ditugaskan; akun disiapkan admin; Called dan Serving terpisah. Admin dapat memilih loket mana pun. Sistem menggunakan tanggal Asia/Makassar secara default (`QUEUE_TIMEZONE` dapat diubah di server). Pada permintaan pertama setelah pergantian hari, sisa Waiting untuk event yang sudah ditutup dibatalkan. Antrean yang dilewati hanya bisa dipanggil lagi jika loket kosong dan pengguna belum memiliki antrean aktif lain.

`backend/seed.json` adalah data awal; server membuat `backend/db.json` ketika pertama dijalankan. Data tersebut sengaja tidak masuk Git, sehingga setiap komputer punya data demo lokal. Untuk reset data demo, hentikan server dan hapus `backend/db.json`; ini menghapus semua perubahan lokal. Server harus dijalankan sebagai **satu proses**. Ini bukan sistem database multi-instance.

Status diperbarui dengan polling setiap lima detik (tarik layar untuk refresh). Estimasi giliran dihitung dari rata-rata durasi layanan hari itu. Getaran terjadi saat tersisa tiga antrean atau kurang, selama aplikasi terbuka dan getar aktif di Profil; tidak ada notifikasi push.

## Keamanan demo

Password disimpan sebagai teks biasa. Login dan header ID pengguna bukan autentikasi aman: identitas dapat dipalsukan, data API dapat dibaca di jaringan, HTTP tidak dienkripsi, dan sesi AsyncStorage tidak aman untuk rahasia. Jangan gunakan data nyata atau mengekspos server ke internet. Sistem produksi memerlukan autentikasi aman, hash password, otorisasi yang kuat, HTTPS, dan database transaksional.

## Pemeriksaan

```powershell
npm test
npm run typecheck
npm run lint
npx expo-doctor
```

Checklist emulator:

- [ ] Masuk dengan setiap role, tutup dan buka ulang aplikasi untuk memeriksa sesi, lalu logout.
- [ ] User mengambil antrean dan melihat tiket; mengambil kedua kalinya ditolak; batalkan saat Menunggu.
- [ ] Dengan dua user, urutan nomor dan jumlah di depan benar.
- [ ] Petugas: panggil berikutnya, panggil ulang, lewati, panggil kembali (tab Daftar), mulai layani, selesai.
- [ ] Admin membuat/mengubah event dan statusnya, membuat petugas dan loket, melihat statistik.
- [ ] Uji server mati, event dijeda, kuota habis, dan layar kecil.

Jangan commit `.env`, `backend/db.json`, atau kredensial.

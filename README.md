# CampusQueue

Aplikasi antrean layanan kampus berbasis Expo/React Native untuk Android, dengan server demo Node.js menggunakan middleware json-server. Aplikasi dan API berada dalam satu repositori agar dapat dipindahkan melalui Git.

## Prasyarat dan menjalankan

Gunakan Node.js LTS yang didukung oleh Expo SDK 58, npm, dan Git. Lihat [PC_LAB_SETUP.md](PC_LAB_SETUP.md) untuk langkah Windows, emulator, dan perangkat fisik.

```powershell
npm ci
Copy-Item .env.example .env
npm run backend
```

Di terminal lain jalankan `npm start`, kemudian buka aplikasi di Android Emulator atau Expo Go. `.env.example` menggunakan `10.0.2.2` untuk emulator Android. Perangkat fisik memerlukan alamat LAN komputer server. Setelah mengubah `.env`, mulai ulang Expo (`npx expo start --clear`).

## Akun demo

Semua password adalah `demo123`:

| Role | Email |
| --- | --- |
| User | user@campusqueue.test |
| Petugas | petugas@campusqueue.test |
| Admin | admin@campusqueue.test |
| User kedua | rani@campusqueue.test |

## Aturan dan asumsi

Event diperlakukan sebagai layanan yang dapat dibuka, dijeda, atau ditutup; petugas hanya mengendalikan loket yang ditugaskan; akun disiapkan admin; Called dan Serving terpisah. Admin dapat memilih loket mana pun. Sistem menggunakan tanggal Asia/Makassar secara default (`QUEUE_TIMEZONE` dapat diubah di server). Pada permintaan pertama setelah pergantian hari, sisa Waiting untuk event yang sudah ditutup dibatalkan. Server harus berjalan agar operasi ini terjadi. Antrean yang dilewati hanya bisa dipanggil lagi jika loket kosong dan pengguna belum memiliki antrean aktif lain.

`backend/seed.json` adalah data awal; server membuat `backend/db.json` ketika pertama dijalankan. Data tersebut sengaja tidak masuk Git, sehingga setiap komputer punya data demo lokal. Untuk reset data demo, hentikan server dan hapus `backend/db.json`; ini menghapus semua perubahan lokal. Server harus dijalankan sebagai **satu proses**: perubahan antrean dijalankan secara sinkron dan file ditulis atomik dalam proses tersebut. Ini bukan sistem database multi-instance.

## Keamanan demo

Password disimpan sebagai teks biasa. Login dan header ID pengguna bukan autentikasi aman: identitas dapat dipalsukan, data API dapat dibaca di jaringan, HTTP tidak dienkripsi, dan sesi AsyncStorage tidak aman untuk rahasia. Validasi role dan transisi di server membantu demo tetapi tidak membuatnya aman. Jangan gunakan data nyata atau mengekspos server ke internet. Sistem produksi memerlukan autentikasi aman, hash password, otorisasi yang kuat, HTTPS, dan database transaksional.

## Pemeriksaan

```powershell
npm test
npm run typecheck
npm run lint
npx expo-doctor
```

Lihat checklist emulator dalam `PC_LAB_SETUP.md`. Tidak ada estimasi waktu tunggu atau notifikasi push; banner dan getaran terjadi ketika layar aplikasi sedang terbuka dan data diperbarui.

# Menjalankan CampusQueue di PC Lab Windows

## 1. Persiapan

Pasang Git, Node.js LTS yang kompatibel dengan Expo SDK 58, VS Code, dan Android Studio dengan Android SDK serta emulator. Pastikan terminal VS Code menggunakan PowerShell (Terminal > New Terminal), atau buka PowerShell dari menu Start. Periksa `node --version`, `npm --version`, dan `git --version`.

## 2. Clone dan instal

Setelah repository GitHub tersedia, ganti URL berikut dengan URL repository Anda:

```powershell
git clone https://github.com/USERNAME/campusqueue-mobile.git
cd campusqueue-mobile
code .
npm ci
Copy-Item .env.example .env
```

`npm ci` memasang versi yang tercatat dalam lockfile. File `.env` bersifat lokal dan tidak masuk Git.

## 3. Jalankan server dan aplikasi

Pada terminal pertama:

```powershell
npm run backend
```

Server mendengarkan port 3000. Buka Android Studio > Device Manager dan jalankan virtual device Android. Pada terminal kedua di folder proyek:

```powershell
npm start
```

Tekan `a` pada terminal Expo untuk membuka aplikasi Android. Jika diminta, pasang Expo Go pada emulator. `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000` dalam `.env` adalah alamat server di komputer host dari emulator Android. `localhost` pada emulator berarti emulator itu sendiri; `10.0.2.2` mengarah ke host emulator.

Untuk perangkat Android fisik, sambungkan ponsel dan komputer ke jaringan yang sama, jalankan `ipconfig` di komputer, dan ubah `.env` menjadi `EXPO_PUBLIC_API_URL=http://ALAMAT_IPV4_KOMPUTER:3000` (contoh format: `http://192.168.1.10:3000`; gunakan alamat aktual). Mulai ulang Expo dengan `npx expo start --clear`. Firewall Windows mungkin perlu mengizinkan koneksi masuk pada port 3000 untuk jaringan yang dipercaya. Jangan pakai jaringan publik atau data nyata: server ini hanya untuk demo.

Buka `http://localhost:3000/health` di browser komputer untuk memeriksa server. Masuk dengan akun demo di README. Jika ponsel tidak terhubung, periksa alamat, jaringan, firewall, dan apakah backend masih berjalan.

## 4. Proyek native jika diperlukan

Expo tidak membutuhkan folder `android` untuk menjalankan lewat Expo Go. Jika dosen meminta proyek native, di komputer lab jalankan `npx expo prebuild --platform android`, lalu buka folder `android` yang dibuat di Android Studio. Perintah ini membuat file native dan membutuhkan penyimpanan serta SDK; jangan lakukan di laptop yang terbatas. Jangan mengedit folder native hasil generate tanpa memahami bahwa prebuild dapat menimpa perubahan.

## 5. Simpan dan pindahkan pekerjaan

```powershell
git status
git add .
git commit -m "feat: jelaskan perubahan"
git push origin main
```

Di komputer lain:

```powershell
cd campusqueue-mobile
git pull origin main
npm ci
npm run backend
```

Buka terminal kedua dan jalankan `npm start`. `git pull` hanya mengambil source; ia tidak memasang dependensi atau menjalankan aplikasi. Jangan commit `.env`, `backend/db.json`, atau kredensial.

## 6. Checklist pengujian emulator

- [ ] Masuk dengan setiap role, tutup dan buka ulang aplikasi untuk memeriksa sesi, lalu logout.
- [ ] User mengambil antrean; mencoba mengambil kedua kalinya ditolak; batalkan saat Waiting.
- [ ] Petugas melihat daftar layanan yang buka; periksa tombol kembali Android dan perpindahan route setiap role.
- [ ] Uji Called dan Serving yang melewati pergantian hari: selesaikan atau lewati antrean lama, lalu panggil nomor hari ini.
- [ ] User yang mengambil nomor saat masih aktif diarahkan ke tiketnya.
- [ ] Dengan dua user, pastikan urutan nomor dan jumlah di depan benar; tunggu polling lima detik dan tarik layar untuk refresh.
- [ ] Pastikan banner dan getaran saat tersisa tiga atau kurang, serta petunjuk loket saat Called.
- [ ] Petugas panggil berikutnya, panggil ulang, lewati, panggil kembali, mulai layani, dan selesaikan; loket tidak dapat memanggil dua antrean sekaligus.
- [ ] Admin membuat dan mengubah event, mengubah status, membuat petugas/loket dan penugasan, serta melihat statistik dan riwayat sendiri.
- [ ] Uji keadaan server mati, event dijeda, kuota habis, dan layar kecil; periksa pesan kesalahan.
- [ ] Jalankan `npm test`, `npm run typecheck`, `npm run lint`, dan `npx expo-doctor`.

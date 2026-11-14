# REPLAY

Pemutar musik offline untuk Android yang nggak ribet. Cukup tempel link YouTube, lagunya langsung diunduh ke HP kamu, liriknya otomatis nempel, dan bisa diputar kapan pun tanpa kuota, tanpa buffering, dan tanpa gangguan iklan (ga suka pembajak tapi suka membajak).

---

## Kenapa Bikin Aplikasi Ini?

Pernah nggak ngerasa kesel dengerin lagu di YouTube tapi layarnya harus nyala terus? Atau langganan aplikasi streaming musik yang tiap bulan makin mahal, tapi lagunya kadang tiba-tiba hilang karena lisensi?

Aplikasi ini dibuat buat ngatasin hal-hal itu:

* **Download langsung di dalam aplikasi**: Nggak butuh server perantara, bot luar, atau converter web yang penuh pop-up iklan. Di dalam APK ini sudah ditanam mesin yt-dlp, Python, dan FFmpeg. Kamu tempel link, HP kamu sendiri yang proses unduhannya jadi file audio bersih.
* **Lirik sinkron otomatis**: Waktu lagu diunduh, aplikasi langsung mencarikan lirik sinkron dari LRCLIB. Pas lagu diputar, liriknya jalan otomatis baris demi baris layaknya di platform streaming besar.
* **Bisa putar di latar belakang**: Mau layar HP mati atau kamu lagi buka aplikasi lain seperti WhatsApp dan navigasi, musik tetap jalan normal lewat foreground media service dengan kontrol penuh di bar notifikasi.
* **Koleksi milik kamu seutuhnya**: Semua lagu tersimpan aman di penyimpanan lokal HP kamu. Mau diputar di pedalaman tanpa sinyal atau pas mode pesawat, musik tetap nyala.
* **Bebas iklan dan gratis**: Tanpa algoritma rekomendasi yang maksa, tanpa banner iklan yang menutupi layar, murni pemutar musik buat koleksi pribadi kamu.

---

## Fitur Utama

* **Pencarian & Unduh Audio**: Ambil audio dengan kualitas terbaik dari YouTube cukup lewat tautan.
* **Sinkronisasi Lirik**: Tampilan lirik realtime yang bergerak otomatis mengikuti detik lagu.
* **Manajemen Playlist & Antrean**: Bikin playlist sendiri, tambah lagu favorit, dan atur giliran lagu sesuka hati.
* **Visualizer Audio**: Tampilan visual gelombang suara yang dinamis saat musik diputar.
* **Ringan & Hemat Baterai**: Antarmuka gelap yang nyaman di mata dan hemat daya.

---

## Cara Build APK

Aplikasi ini menggunakan modul native untuk menjalankan yt-dlp di Android. Tapi tenang, kamu nggak harus install Android Studio yang berat di laptop. Kamu bisa memanfaatkan EAS Build (cloud build gratis dari Expo).

### 1. Build APK Siap Pakai (Standalone APK)

Kalau kamu cuma mau file `.apk` yang langsung bisa dipasang dan dipakai harian di HP:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile preview --platform android
```

Tunggu proses build selesai di cloud, unduh file APK dari tautan yang diberikan, lalu install di HP Android kamu.

### 2. Mode Pengembangan (Development Build)

Kalau kamu mau ngulik atau ngembangin kodenya:

Buat development client terlebih dahulu:
```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform android
```

Setelah APK hasil development client dipasang di HP, jalankan dev server dari laptop (pastikan HP dan laptop terhubung ke jaringan Wi-Fi yang sama):

```bash
npx expo start --dev-client
```

Setiap kamu mengedit kode tampilan di folder `src/`, perubahannya langsung muncul di layar HP seketika tanpa perlu build ulang. Build ulang hanya diperlukan jika kamu mengubah konfigurasi native di `modules/ytdl/` atau `app.json`.

---

## Struktur Kode

Untuk kamu yang tertarik melihat cara kerjanya di balik layar:

* `modules/ytdl/` — Custom native module Kotlin berbasis `youtubedl-android` yang membundel yt-dlp, runtime Python, QuickJS, dan binary FFmpeg langsung ke dalam aplikasi Android.
* `src/lib/player.js` — Logika pemutar audio berbasis `expo-audio` dengan dukungan background playback dan foreground notification.
* `src/lib/library.js` — Penyimpanan database lokal (`library.json`), riwayat unduhan, dan manajemen playlist.
* `src/lib/lrc.js` — Modul pembersihan judul lagu dan integrasi API LRCLIB untuk mengambil lirik tersinkronisasi.
* `src/lib/visualizer.js` — Komponen visualizer visual audio saat lagu diputar.
* `src/app/` — Seluruh alur tampilan antarmuka dan navigasi layar menggunakan Expo Router.

---

## Kontribusi & Lisensi

Proyek ini terbuka untuk siapa saja yang ingin belajar atau menambahkan fitur baru. Silakan fork repository ini, buat branch baru, dan kirimkan pull request.

# Catatan Pengembangan & Bug

## Bug / Masalah Saat Ini
- Masih no issue (kalau ketemu bisa ingfo aku ye)

## Rencana Fitur (Roadmap)
- **Banner “Kamu sedang offline”** : Muncul saat tidak ada koneksi internet.
- **Notifikasi Saat Download Sedang Berlangsung** : Muncul saat sedang proses download.
- **Notifikasi Saat Download Selesai** : Muncul saat download selesai.
- **Notifikasi Saat Download Gagal** : Muncul saat download gagal.
- **Notifikasi Saat Download Dibatalkan** : Muncul saat download dibatalkan.
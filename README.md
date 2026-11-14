# Musik (Android)

Pemutar musik offline: download audio YouTube (yt-dlp di dalam APK), lirik dari LRCLIB, playlist, putar di latar belakang.

## Build APK (tanpa Android Studio, lewat EAS di cloud)

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform android
```

Pasang APK hasil build di HP, lalu jalankan dev server dan buka app-nya (HP dan laptop di Wi-Fi yang sama):

```bash
npx expo start --dev-client
```

Perubahan JavaScript langsung tampil tanpa build ulang. Build ulang hanya kalau mengubah `modules/ytdl`, `app.json`, atau menambah library native.

APK mandiri (tanpa dev server): `npx eas-cli@latest build --profile preview --platform android`.

## Struktur
- `modules/ytdl/` – native module Kotlin (youtubedl-android: yt-dlp + Python + QuickJS + ffmpeg)
- `src/lib/library.js` – data lagu/playlist (`library.json`) dan downloader
- `src/lib/player.js` – pemutar (expo-audio `AudioPlaylist`)
- `src/lib/lrc.js` – lirik LRCLIB (`npm test` untuk tesnya)
- `src/app/` – layar (Expo Router)

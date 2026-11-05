# Nestchain Desktop

Hak cipta PT Lentera Alam Nusantara, semua hak dilindungi (lihat LICENSE). Repo ini publik hanya supaya
installer dan pembaruan otomatis bisa diunduh; kode ERP-nya sendiri tidak ada di sini.

Aplikasi desktop Nestchain ERP untuk Windows (.exe) dan Mac (.dmg). Dibuat dengan Electron: jendela aplikasi
yang membuka instalasi Nestchain milik perusahaan (`<kode>.nestchain.id`). Data tetap di server Nestchain;
aplikasi ini menyediakan ikon di desktop, layar penuh untuk tablet stasiun, menu bahasa Indonesia, dan
pembaruan otomatis dari GitHub Releases.

## Cara kerja untuk pengguna

1. Pasang `NestchainSetup.exe` (Windows) atau `Nestchain.dmg` (Mac) dari nestchain.id/unduh.
2. Saat pertama dibuka, isi **kode perusahaan** (misalnya `ohj`). Aplikasi membuka `https://ohj.nestchain.id/login`.
   Kode diingat di komputer itu. Tombol **Coba versi demo** membuka instalasi demo.
3. Login dengan akun Nestchain seperti di browser. Tidak ada kunci lisensi; batas paket ditegakkan di server.
4. Tampilan penuh tanpa bilah menu. Pintasan: Ganti perusahaan (Ctrl+Shift+P), Muat ulang (Ctrl+R), Layar penuh (F11),
   Perbesar/Perkecil (Ctrl+= / Ctrl+-). Tekan Alt untuk melihat menu, termasuk Periksa pembaruan.
5. Pembaruan diperiksa saat aplikasi dibuka; bila ada versi baru, diunduh dan dipasang, lalu aplikasi dimulai ulang.

Alias kode yang belum punya subdomain diatur di `src/index.html` (`ALIAS`). Saat Markaswalet pindah ke
`app.nestchain.id` dan demo ke `demo.nestchain.id`, hapus alias itu.

## Membangun di laptop

Hanya perlu Node.js.

```
npm install
npm start        # jalankan untuk uji (NESTCHAIN_KODE=demo npm start untuk melewati layar pembuka)
npm run build    # hasil: dist/NestchainSetup-<versi>.exe
```

Ikon dari `build/icon.png` (1024 px), electron-builder membuat .ico dan .icns sendiri.

## Rilis ke pengguna

1. Naikkan `version` di `package.json`.
2. `git tag v0.1.1 && git push origin main --tags`.
3. GitHub Actions (`.github/workflows/release.yml`) membangun Windows dan Mac, lalu menerbitkan release berisi
   installer, `latest.yml`, dan `latest-mac.yml`. Aplikasi yang terpasang membaca berkas itu dan memperbarui dirinya.
   Tidak perlu rahasia tambahan; `GITHUB_TOKEN` bawaan Actions sudah cukup untuk repo privat maupun publik.

## Tanda tangan kode (opsional, menghilangkan peringatan saat instalasi)

- Windows: Azure Trusted Signing (±USD 10/bulan) lewat `win.azureSignOptions` di package.json.
- Mac: Apple Developer Program (USD 99/tahun). Isi `CSC_LINK` (sertifikat .p12 base64), `CSC_KEY_PASSWORD`,
  `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` di rahasia repo.

Tanpa tanda tangan, aplikasi tetap jalan; Windows menampilkan peringatan SmartScreen yang harus dilewati dengan
"More info > Run anyway", dan Mac perlu klik kanan > Open saat pertama kali.

## Perangkat keras

Halaman di `*.nestchain.id` diberi izin Web Serial, WebUSB, WebHID, dan Bluetooth, jadi timbangan digital atau alat ukur
bisa dibaca langsung dari halaman web (`navigator.serial.requestPort()`), tanpa perubahan di aplikasi desktop.
Pemilihan perangkat memakai perangkat pertama yang lolos filter halaman; lihat `aturPerangkatKeras` di `main.js`.

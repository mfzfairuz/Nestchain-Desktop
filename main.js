// Nestchain Desktop (Electron): jendela yang membuka instalasi Nestchain milik perusahaan (<kode>.nestchain.id).
// Data tetap di server. Aplikasi ini memberi: layar kode perusahaan, tampilan penuh tanpa bilah menu
// (pintasan tetap jalan), F11 layar penuh, pembaruan otomatis dari GitHub Releases, dan izin perangkat
// keras (Web Serial, WebUSB, WebHID, Bluetooth) untuk halaman nestchain.id, siap untuk timbangan dan alat ukur.
const { app, BrowserWindow, Menu, dialog, session, shell } = require("electron");
const path = require("path");

const DOMAIN_RESMI = /^https:\/\/([a-z0-9-]+\.)*nestchain\.id$/i;
let jendela;

const asalResmi = (asal) => DOMAIN_RESMI.test(String(asal || "").replace(/\/$/, ""));

function bukaPeluncur(ganti) {
  // NESTCHAIN_KODE=ohj melewati layar pembuka (untuk kios stasiun atau pengujian).
  const kode = process.env.NESTCHAIN_KODE;
  if (kode && !ganti) { jendela.loadURL(/^https?:\/\//.test(kode) ? kode : `https://${kode}.nestchain.id/login`); return; }
  jendela.loadFile(path.join(__dirname, "src", "index.html"), ganti ? { query: { ganti: "1" } } : undefined);
}

async function periksaPembaruan(beriTahuBilaTidakAda) {
  try {
    const { autoUpdater } = require("electron-updater");
    autoUpdater.autoDownload = true;
    autoUpdater.removeAllListeners("update-downloaded");
    autoUpdater.on("update-downloaded", (info) => {
      dialog.showMessageBox(jendela, { message: `Nestchain ERP diperbarui ke versi ${info.version}.`, detail: "Aplikasi akan dimulai ulang untuk memasang pembaruan.", buttons: ["Mulai ulang sekarang", "Nanti"] })
        .then(({ response }) => { if (response === 0) autoUpdater.quitAndInstall(); });
    });
    const hasil = await autoUpdater.checkForUpdates();
    const ada = hasil?.updateInfo?.version && hasil.updateInfo.version !== app.getVersion();
    if (beriTahuBilaTidakAda && !ada) dialog.showMessageBox(jendela, { message: "Nestchain ERP sudah versi terbaru." });
  } catch (e) {
    if (beriTahuBilaTidakAda) dialog.showMessageBox(jendela, { message: "Tidak bisa memeriksa pembaruan.", detail: String(e.message || e) });
  }
}

// Menu aplikasi disembunyikan (tampilan penuh seperti Claude Desktop); pintasannya tetap aktif,
// dan tekan Alt kalau ingin melihat menunya.
function buatMenu() {
  const templat = [
    {
      label: "Nestchain",
      submenu: [
        { label: "Ganti perusahaan...", accelerator: "CmdOrCtrl+Shift+P", click: () => bukaPeluncur(true) },
        { label: "Muat ulang", accelerator: "CmdOrCtrl+R", click: () => jendela.webContents.reload() },
        { label: "Layar penuh", accelerator: "F11", click: () => jendela.setFullScreen(!jendela.isFullScreen()) },
        { label: "Perbesar", accelerator: "CmdOrCtrl+=", click: () => jendela.webContents.setZoomLevel(jendela.webContents.getZoomLevel() + 0.5) },
        { label: "Perkecil", accelerator: "CmdOrCtrl+-", click: () => jendela.webContents.setZoomLevel(jendela.webContents.getZoomLevel() - 0.5) },
        { label: "Ukuran normal", accelerator: "CmdOrCtrl+0", click: () => jendela.webContents.setZoomLevel(0) },
        { type: "separator" },
        { label: "Periksa pembaruan", click: () => periksaPembaruan(true) },
        { type: "separator" },
        { label: "Keluar", role: "quit" },
      ],
    },
    {
      label: "Sunting",
      submenu: [
        { label: "Urungkan", role: "undo" }, { label: "Ulangi", role: "redo" }, { type: "separator" },
        { label: "Potong", role: "cut" }, { label: "Salin", role: "copy" }, { label: "Tempel", role: "paste" }, { label: "Pilih semua", role: "selectAll" },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(templat));
}

// Izin perangkat keras hanya untuk halaman Nestchain. Pemilihan perangkat dari daftar
// (timbangan serial, alat USB/HID) diserahkan ke halaman lewat dialog bawaan Chromium.
function aturPerangkatKeras() {
  const ses = session.defaultSession;
  const izinWeb = new Set(["serial", "usb", "hid", "bluetooth", "notifications", "clipboard-read", "clipboard-sanitized-write", "fullscreen", "media"]);
  ses.setPermissionCheckHandler((wc, izin, asal) => izinWeb.has(izin) && asalResmi(asal));
  ses.setPermissionRequestHandler((wc, izin, callback, detail) => callback(izinWeb.has(izin) && asalResmi(detail.requestingUrl ? new URL(detail.requestingUrl).origin : "")));
  ses.setDevicePermissionHandler((detail) => ["serial", "usb", "hid"].includes(detail.deviceType) && asalResmi(detail.origin));
  // Saat halaman meminta port serial / perangkat, pilih yang pertama cocok; halaman menyaring lewat filter.
  for (const ev of ["select-serial-port", "select-hid-device", "select-usb-device"]) {
    ses.on(ev, (event, daftar, wc, callback) => { event.preventDefault(); callback(daftar[0] ? (daftar[0].portId || daftar[0].deviceId) : ""); });
  }
}

function buatJendela() {
  jendela = new BrowserWindow({
    width: 1366, height: 820, minWidth: 1024, minHeight: 640, show: false,
    title: "Nestchain ERP",
    autoHideMenuBar: true,
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, spellcheck: false },
  });
  jendela.maximize();
  jendela.once("ready-to-show", () => jendela.show());
  jendela.on("page-title-updated", (e) => e.preventDefault());
  // Tautan ke luar nestchain.id (misalnya WhatsApp, dokumen) dibuka di browser bawaan, bukan di jendela ini.
  jendela.webContents.setWindowOpenHandler(({ url }) => {
    if (asalResmi(new URL(url).origin) || url.startsWith("file:")) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });
  bukaPeluncur(false);
  buatMenu();
  periksaPembaruan(false);
}

app.whenReady().then(() => { aturPerangkatKeras(); buatJendela(); });
app.on("window-all-closed", () => app.quit());
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) buatJendela(); });

// Nestchain Desktop, versi Electron: jendela yang membuka instalasi Nestchain milik perusahaan.
// Fitur sama dengan versi Tauri: layar kode perusahaan, menu Indonesia, F11 layar penuh, pembaruan otomatis.
const { app, BrowserWindow, Menu, dialog } = require("electron");
const path = require("path");

let jendela;

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
    autoUpdater.on("update-downloaded", (info) => {
      dialog.showMessageBox(jendela, { message: `Nestchain ERP diperbarui ke versi ${info.version}. Aplikasi akan dimulai ulang.` })
        .then(() => autoUpdater.quitAndInstall());
    });
    const hasil = await autoUpdater.checkForUpdates();
    if (beriTahuBilaTidakAda && !hasil?.updateInfo?.version) dialog.showMessageBox(jendela, { message: "Nestchain ERP sudah versi terbaru." });
  } catch (e) {
    if (beriTahuBilaTidakAda) dialog.showMessageBox(jendela, { message: "Nestchain ERP sudah versi terbaru." });
  }
}

function buatMenu() {
  const templat = [
    {
      label: "Nestchain",
      submenu: [
        { label: "Ganti perusahaan...", accelerator: "CmdOrCtrl+Shift+P", click: () => bukaPeluncur(true) },
        { label: "Muat ulang", accelerator: "CmdOrCtrl+R", click: () => jendela.webContents.reload() },
        { label: "Layar penuh", accelerator: "F11", click: () => jendela.setFullScreen(!jendela.isFullScreen()) },
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

function buatJendela() {
  jendela = new BrowserWindow({
    width: 1366, height: 820, minWidth: 1024, minHeight: 640, show: false,
    title: "Nestchain ERP",
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false },
  });
  jendela.maximize();
  jendela.once("ready-to-show", () => jendela.show());
  // Halaman server tetap memakai judul jendela aplikasi, bukan judul halaman web.
  jendela.on("page-title-updated", (e) => e.preventDefault());
  bukaPeluncur(false);
  buatMenu();
  periksaPembaruan(false);
}

app.whenReady().then(buatJendela);
app.on("window-all-closed", () => app.quit());

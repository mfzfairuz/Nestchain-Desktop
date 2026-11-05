// Hanya versi aplikasi yang diekspos ke halaman; halaman server tidak mendapat akses Node.
const { contextBridge } = require("electron");
contextBridge.exposeInMainWorld("nestchainDesktop", { versi: process.env.npm_package_version || require("./package.json").version });

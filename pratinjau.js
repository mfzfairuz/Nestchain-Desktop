// Render layar pembuka ke PNG untuk dicek tanpa membuka aplikasi. Pakai: node pratinjau.js [lebar] [tinggi]
const path = require("path");
const { chromium } = require("playwright");
const [lebar, tinggi] = [Number(process.argv[2]) || 1366, Number(process.argv[3]) || 820];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: lebar, height: tinggi } });
  const berkas = path.join(__dirname, "src", "index.html").split(path.sep).join("/");
  await p.goto("file:///" + berkas + "?ganti=1");
  await p.waitForTimeout(800);
  const keluar = path.join(__dirname, "dist", `pratinjau-${lebar}x${tinggi}.png`);
  await p.screenshot({ path: keluar });
  await b.close();
  console.log(keluar);
})();

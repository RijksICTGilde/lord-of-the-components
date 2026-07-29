import { chromium } from "playwright";
const shots = [
  ["http://localhost:5811/bg-overzicht.html", "screenshots/recreate/overzicht-nldd.png", true],
  ["http://localhost:5822/bg-overzicht-rvo.html", "screenshots/recreate/overzicht-rvo.png", false],
  ["http://localhost:5811/zelf.html", "screenshots/recreate/zelf-nldd.png", true],
  ["http://localhost:5822/zelf-rvo.html", "screenshots/recreate/zelf-rvo.png", false],
];
const b = await chromium.launch({ args: ["--no-sandbox"] });
for (const [url, out, isNldd] of shots) {
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1 });
  await p.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await p.waitForTimeout(1200);
  if (isNldd) { try { await p.waitForFunction(() => !document.querySelector("nldd-card:not(:defined)"), { timeout: 8000 }); } catch {} }
  await p.waitForTimeout(600);
  await p.screenshot({ path: out, fullPage: true });
  console.log("shot", out);
  await p.close();
}
await b.close();

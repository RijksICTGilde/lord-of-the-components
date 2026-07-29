import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1 });
await p.goto("http://localhost:5811/zelf.html", { waitUntil: "networkidle", timeout: 30000 });
await p.waitForTimeout(1500);
try { await p.waitForFunction(() => !document.querySelector("nldd-card:not(:defined)"), { timeout: 8000 }); } catch {}
await p.waitForTimeout(800);
await p.screenshot({ path: "screenshots/recreate/zelf-lotc.png", fullPage: true });
console.log("shot zelf-lotc.png");
await b.close();

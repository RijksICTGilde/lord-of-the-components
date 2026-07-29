import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--no-sandbox"] });
async function shot(url, out, nldd){
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1 });
  await p.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await p.waitForTimeout(1200);
  if(nldd){ try { await p.waitForFunction(()=>!document.querySelector("nldd-card:not(:defined)"),{timeout:8000}); } catch{} }
  await p.waitForTimeout(600);
  await p.screenshot({ path: out, fullPage: true }); console.log("shot", out); await p.close();
}
await shot("http://localhost:5811/apps.html","screenshots/recreate/apps-nldd.png",true);
await shot("http://localhost:5822/apps-rvo.html","screenshots/recreate/apps-rvo.png",false);
await b.close();

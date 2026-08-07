import { chromium } from "playwright";

const b = await chromium.launch({ args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1200, height: 1400 }, deviceScaleFactor: 2 });
await p.goto("http://localhost:5814/nldd-storybook.html", { waitUntil: "networkidle", timeout: 30000 });

// let the NLDD custom elements (nldd-form-field, nldd-text-field, …) upgrade
await p.waitForTimeout(1200);
try {
  await p.waitForFunction(
    () => !document.querySelector("nldd-form-field:not(:defined), nldd-text-field:not(:defined)"),
    { timeout: 8000 },
  );
} catch {}
await p.waitForTimeout(600);

// clip to the Forms section: from its <h2> down to the bottom of the last field story
const clip = await p.evaluate(() => {
  const head = document.getElementById("cat-lotc-forms");
  const last = document.getElementById("c-action-group");
  const a = head.getBoundingClientRect();
  const bft = last.getBoundingClientRect();
  const top = a.top + window.scrollY - 12;
  const bottom = bft.bottom + window.scrollY + 12;
  return { x: Math.max(0, a.left - 12), y: top, width: Math.min(940, window.innerWidth), height: bottom - top };
});

await p.screenshot({ path: "screenshots/recreate/storybook-forms-nldd.png", clip, fullPage: true });
console.log("shot storybook-forms-nldd.png", JSON.stringify(clip));
await b.close();

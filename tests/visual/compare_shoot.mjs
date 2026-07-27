// Reads _cmp_manifest.json (from compare.py) and screenshots each isolated
// component into screenshots/compare/<component>-<theme>-<kind>.png.
//
// Needs both serve.py instances running:
//   uv run python tests/visual/serve.py --port 5810 --theme rvo &
//   uv run python tests/visual/serve.py --port 5811 --theme nldd &
// Run from /workspace: node tests/visual/compare_shoot.mjs
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";

const PORTS = { rvo: 5810, nldd: 5811 };
const OUT = "/workspace/screenshots/compare";
mkdirSync(OUT, { recursive: true });

const manifest = JSON.parse(readFileSync("/workspace/tests/visual/_cmp_manifest.json", "utf-8"));
const browser = await chromium.launch({ args: ["--no-sandbox"] });

for (const { component, theme, kind, fixture } of manifest) {
  const page = await browser.newPage({ viewport: { width: 900, height: 400 }, deviceScaleFactor: 2 });
  const url = `http://localhost:${PORTS[theme]}/${fixture}`;
  await page.goto(url, { waitUntil: "networkidle" });
  if (theme === "nldd") {
    await page.waitForFunction(() => !document.querySelector(":not(:defined)"), { timeout: 15000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
  }
  const out = `${OUT}/${component}-${theme}-${kind}.png`;
  const el = await page.$("#cmp-root");
  // Tight crop around the component (with a little padding), falling back to a
  // fixed box if the element has no size.
  const box = el ? await el.boundingBox() : null;
  if (box && box.width > 2 && box.height > 2) {
    const pad = 8;
    await page.screenshot({
      path: out,
      clip: {
        x: Math.max(0, box.x - pad),
        y: Math.max(0, box.y - pad),
        width: box.width + pad * 2,
        height: box.height + pad * 2,
      },
    });
  } else {
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 500, height: 120 } });
  }
  console.log("shot", `${component}-${theme}-${kind}`);
  await page.close();
}

await browser.close();

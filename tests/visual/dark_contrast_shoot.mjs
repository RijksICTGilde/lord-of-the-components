// Measure, in Chromium, what a dark page actually renders: per text run the
// computed colour, the background that really lies under it (piercing shadow
// roots and transparent ancestors), and the WCAG contrast ratio. Plus "light
// islands": painted boxes lighter than the page itself.
//
// This is the gate a `var(--token, #fff)` fallback slips past unnoticed — the
// name resolves to nothing, the literal wins, and only the rendered pixel says
// so. The static counterpart is python/tests/test_theme_token_names.py.
//
//   python tests/visual/serve.py --port 5555 --theme nldd &
//   node tests/visual/dark_contrast_shoot.mjs \
//     'http://localhost:5555/dark-scheme.html?ds=nldd,lotc-forms'
//
// Two things the numbers depend on: the page background is the *canvas* (NLDD
// paints no body background), which only reads dark because `data-scheme="dark"`
// on <html> sets `color-scheme`; and the theme's computed colours come back as
// oklch(), so every colour is resolved through a canvas pixel rather than by
// parsing rgb() text.
import { chromium } from 'playwright';

const url = process.argv[2];
// The same fixture, measured in the other stand: `--light` flips <html> to
// data-scheme="light" after load. A colour that only works in one scheme is a
// defect either way round, and the light run is what proves the sweep did not
// trade one for the other.
const light = process.argv.includes('--light');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ colorScheme: light ? 'light' : 'dark' });
if (light) {
  // Rewrite the attribute in the RESPONSE, not afterwards in the DOM: a chart
  // reads its colours while it is being built, so flipping the scheme after
  // load would measure dark chart ink against a light page and call it fine.
  await page.route(url, async (route) => {
    const res = await route.fetch();
    const body = (await res.text()).replace(/data-scheme="dark"/g, 'data-scheme="light"');
    await route.fulfill({ response: res, body });
  });
}
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

const result = await page.evaluate(() => {
  const lum = (c) => {
    const [r, g, b] = c.map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  // Computed colours come back in whatever space the token used (the NLDD
  // primitives are oklch), so resolve every colour through a canvas pixel
  // instead of parsing rgb() text — that is the sRGB the screen actually shows.
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = 1;
  const ctx = cvs.getContext('2d', { willReadFrequently: true });
  const cache = new Map();
  const parse = (s) => {
    if (!s) return null;
    if (cache.has(s)) return cache.get(s);
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = s;
    if (ctx.fillStyle === '#000' && !/^(#000000|black|rgba?\(0, 0, 0)/.test(s)) {
      cache.set(s, null);
      return null;               // unparseable colour
    }
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    const out = { rgb: [d[0], d[1], d[2]], a: d[3] / 255 };
    cache.set(s, out);
    return out;
  };
  const over = (fg, bg) => fg.rgb.map((v, i) => v * fg.a + bg[i] * (1 - fg.a));
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };
  // Walk up (through shadow hosts) accumulating translucent layers.
  const bgUnder = (el) => {
    let stack = [];
    let node = el;
    while (node) {
      const c = parse(getComputedStyle(node).backgroundColor);
      if (c && c.a > 0) stack.push(c);
      if (c && c.a === 1) break;
      node = node.parentElement || (node.getRootNode() && node.getRootNode().host) || null;
    }
    const probe = document.createElement('div');
    probe.style.cssText = 'background-color:Canvas;position:fixed;left:-9999px';
    document.documentElement.appendChild(probe);
    const canvas = parse(getComputedStyle(probe).backgroundColor);
    probe.remove();
    let base = canvas ? canvas.rgb : [255, 255, 255];
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
    return base;
  };
  const all = (root, out = []) => {
    for (const el of root.querySelectorAll('*')) {
      out.push(el);
      if (el.shadowRoot) all(el.shadowRoot, out);
    }
    return out;
  };

  const els = all(document);
  const pageBg = bgUnder(document.body);
  const texts = [];
  const islands = [];
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const bg = bgUnder(el);
    const ownBg = parse(cs.backgroundColor);
    if (ownBg && ownBg.a > 0.5 && lum(bg) >= 0.5 && lum(bg) - lum(pageBg) >= 0.4) {
      islands.push({ sel: el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0], bg: cs.backgroundColor });
    }
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) continue;
    const fg = parse(cs.color);
    if (!fg) continue;
    const fgOver = over(fg, bg);
    texts.push({
      sel: el.tagName.toLowerCase() + (el.className ? '.' + el.className.toString().trim().split(/\s+/)[0] : ''),
      text: el.textContent.trim().slice(0, 28),
      color: cs.color,
      bg: `rgb(${bg.map(Math.round).join(', ')})`,
      ratio: +ratio(fgOver, bg).toFixed(2),
      size: parseFloat(cs.fontSize),
      bold: +cs.fontWeight >= 700,
    });
  }
  // A <canvas> holds no text nodes, so everything above is blind to it — a
  // chart drawn in near-black on a dark page measures as nothing at all.
  // Sample its pixels instead and count the ink that is invisible against the
  // background it was painted on.
  const canvases = [];
  for (const el of els) {
    if (el.tagName !== 'CANVAS' || !el.width || !el.height) continue;
    const bg = bgUnder(el);
    let ink = 0;
    let faint = 0;
    let worst = null;
    try {
      const d = el.getContext('2d').getImageData(0, 0, el.width, el.height).data;
      // Group by the colour that ends up on screen, not by pixel. Antialiasing
      // spreads an edge over MANY faint colours with a handful of pixels each;
      // a track or grid drawn in the page's own colour is ONE colour over a
      // large area. Only the second is a defect, and only mass tells them apart
      // — filtering on alpha does not: the old grid was rgba(0,0,0,.06), i.e.
      // exactly the low-alpha ink an alpha filter would skip.
      const mass = new Map();
      for (let i = 0; i < d.length; i += 4) {
        const a = d[i + 3] / 255;
        if (a < 0.05) continue;
        ink++;
        const px = [
          Math.round(d[i] * a + bg[0] * (1 - a)),
          Math.round(d[i + 1] * a + bg[1] * (1 - a)),
          Math.round(d[i + 2] * a + bg[2] * (1 - a)),
        ];
        const key = px.join(',');
        mass.set(key, (mass.get(key) || 0) + 1);
      }
      const FLOOR = Math.max(150, ink * 0.02);   // a real area, not an edge
      for (const [key, n] of mass) {
        const px = key.split(',').map(Number);
        // 1.1:1 is "the same colour as the background", not "subtle": the two
        // luminances differ by a few percent. The defect this catches measured
        // 1.01:1 (a grid drawn in rgba(0,0,0,.06) on a dark page). The theme's
        // own divider is 1.25:1 on white — faint by design, and the colour
        // every card border already uses, so it must NOT be flagged. Anything
        // between is the design system's call, not this script's.
        if (n >= FLOOR && ratio(px, bg) < 1.1) {
          faint += n;
          if (!worst || n > worst.n) worst = { colour: `rgb(${key})`, n, ratio: +ratio(px, bg).toFixed(2) };
        }
      }
    } catch {
      return { error: 'canvas is tainted — cannot sample' };
    }
    canvases.push({
      sel: (el.id || el.tagName.toLowerCase()),
      bg: `rgb(${bg.map(Math.round).join(', ')})`,
      ink,
      faint,
      worst,
      faintPct: ink ? +(100 * faint / ink).toFixed(1) : 0,
    });
  }
  return { pageBg: `rgb(${pageBg.map(Math.round).join(', ')})`, texts, islands, canvases };
});

const islands = light ? [] : result.islands;   // a light page is allowed to be light
const large = (t) => t.size >= 24 || (t.bold && t.size >= 18.66);
const fails = result.texts.filter((t) => t.ratio < (large(t) ? 3 : 4.5));
console.log(`scheme: ${light ? 'light' : 'dark'}`);
console.log(`page background: ${result.pageBg}`);
console.log(`text runs measured: ${result.texts.length}`);
console.log(`below WCAG AA: ${fails.length}`);
for (const f of fails) console.log(`  FAIL ${f.ratio.toFixed(2)}  ${f.sel}  ${f.color} on ${f.bg}  "${f.text}"`);
console.log(`light islands: ${islands.length}${light ? ' (not applicable in light)' : ''}`);
for (const i of islands) console.log(`  ISLAND ${i.sel} ${i.bg}`);
// A canvas that drew nothing at all is not a pass — say so, so the check
// cannot be vacuously green (e.g. Chart.js failed to load).
const blank = result.canvases.filter((c) => c.ink === 0);
const faint = result.canvases.filter((c) => c.ink > 0 && c.faint > 0);
console.log(`canvases: ${result.canvases.length} (blank: ${blank.length}, with invisible ink: ${faint.length})`);
for (const c of result.canvases) {
  const flag = c.ink === 0 ? 'BLANK ' : c.faint > 0 ? 'FAINT ' : 'ok    ';
  const why = c.worst ? `  <- ${c.worst.colour} over ${c.worst.n}px at ${c.worst.ratio}:1` : '';
  console.log(`  ${flag}${c.sel}  ink=${c.ink}px  invisible=${c.faintPct}%${why}  on ${c.bg}`);
}
if (process.argv.includes('--all')) {
  console.log('\nevery measured run:');
  for (const t of result.texts) console.log(`  ${t.ratio.toFixed(2)}  ${t.sel}  ${t.color} on ${t.bg}  "${t.text}"`);
}
await browser.close();
process.exit(fails.length || islands.length || blank.length || faint.length ? 1 : 0);

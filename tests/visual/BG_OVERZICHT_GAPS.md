# bg.rijks.app Overzicht — components recreation & gap report

> **Update — BGNLDD theme.** The custom app components below (sidenav, metric,
> layer, section-head, activity, shortcut) are now provided by the **BGNLDD**
> theme (`packages/lotc-bgnldd`), a mix-and-match layer on top of NLDD. The
> recreation (`gen_bg_overzicht.py`) is now built 100% from `c-*` components
> under `design_systems=["nldd", "bgnldd"]`, rendered end-to-end through
> `<c-page design-systems="nldd bgnldd">`. The header **utility menu** is now
> provided too (`c-menu-bar` + `c-menu-bar-item` → `nldd-menu-bar` in the top-nav
> utility slot; `c-header` renders its children inside the nav bar), and section
> titles use the real `nldd-title` component. **Only the status bar remains** as a
> gap. The original "pure NLDD-only" measurement is kept below for the record.

---

# (original) pure-components recreation & gap report

Recreation of the [bg.rijks.app](https://bg.rijks.app/) Overzicht page built with
**only** LOTC `<c-*>` components under the NLDD backend, using **no** app-specific
CSS. The real site is NLDD web components **plus** a substantial layer of bespoke
Vue-scoped CSS (`.rp-*` classes). This exercise measures what the component system
can express on its own — everything that looks off below is a genuine gap, not a
missing stylesheet.

- Source of truth: `tests/visual/gen_bg_overzicht.py` (icons/labels/grouping
  extracted verbatim from the live DOM) → `fixtures/bg-overzicht.html`.
- Shots: `screenshots/recreate/bg-overzicht-{reference,lotc,compare}.png`.
- Regenerate: `python tests/visual/gen_bg_overzicht.py`, serve with
  `python tests/visual/serve.py --port 5811 --theme nldd`, shoot `bg_shoot.mjs`.

## What renders correctly (component output == intended NLDD)

- `c-header` → `nldd-top-navigation-bar` (logo title/subtitle/href).
- `c-button` (+ `icon`/`show-icon`) → `nldd-button` with `start-icon`.
- `c-icon` → `nldd-icon` with the correct semantic-name → NLDD-name mapping.
- `c-card` → `nldd-card`; `c-tag` → `nldd-tag`; `c-heading`/`c-h1..h6`, `c-p`,
  `c-link`, `c-small`.
- `c-app-shell` (header + sidebar + main regions), `c-auto-grid`, `c-columns`,
  `c-stack` — all lay out correctly.

## Bug found & fixed: `c-icon` size mapping (NLDD)

`nldd-icon`'s default is `--_size: 100%` (**fills its parent**) and its `size`
attribute only accepts numeric spacer tokens (`16 20 24 28 32 40 44 48 56 64 80 96`).
Our impl emitted the t-shirt value verbatim (`size="md"`), which NLDD does not
recognise → every icon fell back to filling its parent → giant icons that blew out
the sidebar and wrapped the metric numbers.

Fix: `themes/nldd/components/icon.impl.ts` now maps `2xs..4xl → 16..96` via a
`sizes` valueMap. Regression test: `python/tests/test_icon_size_nldd.py`.
(Before/after is the difference between the first and second `bg-overzicht-lotc.png`.)

## Bug found & fixed: `c-card` had no padding (NLDD)

`nldd-card` has **no intrinsic padding** — `.card__main` is a bare slot
(`card.styles.ts`), so NLDD composes padding with a wrapping `<nldd-container
padding="…">` (the site uses `20` for metric cards, `24` for section cards). Our
impl emitted a bare `<div>` for the body **and ignored the card's own `padding`
prop** (which defaults to `md`), so all card content sat flush against the edge.

Fix: `themes/nldd/components/card.impl.ts` now wraps the body in `<nldd-container>`
and maps the `padding` prop (`none/sm/md/lg/xl → 0/16/20/24/32`) onto NLDD's spacer
scale. `<c-card>` → `<nldd-card><nldd-container padding="20">…` — the site's exact
pattern. Regression: `test_card_alert_nldd.py`.

### Audited faithful (no change needed)

`c-button` (`size="md"` — NLDD button accepts `xs/sm/md/lg`), `c-tag`
(`type="default" → color="neutral"`, matches the site). `c-heading`/`c-h1..h6` map
heading level → `nldd-title size` correctly; the site's smaller visual sizes
(`size="2"` for its h1) are a per-page usage choice, not a component defect.

## Remaining gaps (no component today — documented, not worked around)

1. **Status bar** — the site's top `nldd-status-bar` ("… demo / mock-up …") has no
   LOTC component. Omitted.
2. **Header utility menu** — `c-header` renders only the logo lockup; the site's
   `nldd-menu-bar slot="utility"` (Zoeken / Notificaties / Nieuw / Thema / profiel)
   has no slot on `c-header`. Missing in the recreation.
3. **Nav item** — the sidebar is faked with `c-stack` + `c-icon` + `c-link`.
   `c-link` → `nldd-link` renders as a blue hyperlink; a sidebar item should inherit
   text colour and carry an active/hover state. There is no nav-item component and
   `c-menu`/`c-menu-item` have **no NLDD template** (`menu-item.html.j2` missing), so
   a real sidenav cannot be built with components yet. No active-state on "Overzicht".
4. **Metric / stat value** — the big number uses `c-h2` as a stand-in (semantic
   hack). There is no display-typography / metric component.
5. **Layer rows** (the "De lagen" card) — the site renders per-row icon tiles +
   chevron via `.rp-layer*`; recreated as plain stacked text.

## Other components missing an NLDD template (surfaced while building)

`c-page`, `c-menu` / `c-menu-item`, `c-grid`, `c-layout-row`, `c-layout-column`,
`c-max-width-layout` all raise `TemplateNotFound` under NLDD, and `c-data-list-item`
is not registered. These are theme-agnostic/layout components that generate no NLDD
output today.

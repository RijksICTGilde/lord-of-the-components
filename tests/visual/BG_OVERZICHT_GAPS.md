# bg.rijks.app Overzicht — components recreation & coverage report

Recreation of the [bg.rijks.app](https://bg.rijks.app/) Overzicht / Software-
catalogus / Mijn-overzicht pages built entirely from LOTC `<c-*>` components.

> **Status — resolved.** Every gap the original report listed is now a real
> component. The recreation is built 100% from theme-agnostic `<c-*>` components
> that live in **core** (no per-theme app-component package anymore — the former
> `lotc-bgnldd` layer has been removed). The same source renders end-to-end
> through **both** NLDD and RVO: `design-systems="lotc-layout nldd"` or `"…rvo"`.
> Source: `gen_bg_overzicht.py` / `gen_apps.py` / `gen_zelf.py` →
> `fixtures/{bg-overzicht,apps,zelf}.html`. Shots in `screenshots/recreate/`.

## What renders correctly (component output == intended design system)

Layout — `c-app-shell` (header / sidebar / main / footer regions), `c-auto-grid`,
`c-columns`, `c-stack`, `c-grid`. Primitives — `c-header`, `c-button`, `c-icon`,
`c-card`, `c-tag`, `c-heading`/`c-h1..h6`, `c-p`, `c-link`, `c-small`, `c-badge`,
`c-checkbox`, `c-table`, `c-menu`(+item), `c-tabs`, `c-breadcrumbs`, `c-footer`.

App composites (all theme-agnostic core templates composing the primitives, so
they render in every design system): `c-metric`, `c-sidenav`(+group/+item, with
active state), `c-catalog-card`, `c-filter-bar`(+`c-filter-select`), `c-identity`,
`c-action`, `c-detail-list`(+item), `c-notification`(+item), `c-section-link`,
`c-section-head`, `c-layer`, `c-shortcut`, `c-activity`(+item), `c-chip`,
`c-status-bar`.

## Former gaps — now resolved

1. **Status bar** — now `c-status-bar`, a theme-neutral `lotc-statusbar` banner
   (semantic `type` → variant colour), renders in every theme.
2. **Header utility menu** — `c-menu type="bar" slot="utility"` inside `c-header`
   → `nldd-menu-bar` in the top-nav utility slot.
3. **Nav item / sidebar** — `c-sidenav` + `c-sidenav-item` (icon + label + active
   state via `aria-current`), a real component, not a `c-link` stand-in.
4. **Metric / stat value** — `c-metric` (composes `c-card` + `c-icon`), no more
   `c-h2` semantic hack.
5. **Layer rows** ("De lagen") — `c-layer` (icon tile + title/count + chip row +
   chevron), composed from `c-icon`.

## Bug found & fixed: `c-icon` size mapping (NLDD)

`nldd-icon`'s default is `--_size: 100%` (**fills its parent**) and its `size`
attribute only accepts numeric spacer tokens (`16 20 24 28 32 40 44 48 56 64 80
96`). Our impl emitted the t-shirt value verbatim (`size="md"`), which NLDD does
not recognise → giant icons that blew out the sidebar. Fix:
`themes/nldd/components/icon.impl.ts` maps `2xs..4xl → 16..96` via a `sizes`
valueMap. Regression: `python/tests/test_icon_size_nldd.py`.

## Bug found & fixed: `c-card` had no padding (NLDD)

`nldd-card` has **no intrinsic padding** — `.card__main` is a bare slot, so NLDD
composes padding with a wrapping `<nldd-container padding="…">`. Our impl emitted
a bare `<div>` and ignored the card's own `padding` prop. Fix:
`themes/nldd/components/card.impl.ts` wraps the body in `<nldd-container>` and maps
`padding` (`none/sm/md/lg/xl → 0/16/20/24/32`). `<c-card>` →
`<nldd-card><nldd-container padding="20">…`. Regression: `test_card_alert_nldd.py`.

## NLDD element coverage

Of the 121 custom elements in NLDD's manifest, all but a handful are reachable as
a `<c-*>` — the 95-component generated fragment plus the core primitives and the
semantic composites (`c-menu`→`menu-bar`, `c-header`→`top-navigation-bar`,
`c-tabs`→`tab-bar`, `c-footer`→`page-footer`).

**Intentionally not mapped to the native NLDD element** (rendered theme-agnostic
instead, so they are not NLDD-locked):

- `c-blockquote` → plain `<blockquote>` (not `nldd-blockquote`)
- `c-box` → the lotc-layout Every-Layout box (not `nldd-box`)
- `c-page` → the `<!DOCTYPE html>` document shell (not the `nldd-page` sticky-layout;
  page layout is expressed with `c-app-shell`)
- `c-status-bar` → the theme-neutral banner above (not `nldd-status-bar`)

**Minor genuine gaps** (native sub-parts not individually exposed):
`nldd-page-footer-legal-bar` / `-legal-bar-item` (the footer's legal sub-row —
`c-footer` renders `nldd-page-footer` but not the legal bar) and `nldd-table-row`
(rows inside `c-table`). Add if a page needs them.

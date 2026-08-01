# lotc-layout

Opt-in, theme-agnostic layout primitives for
[Lord of the Components](../../README.md), modelled on
[Every Layout](https://every-layout.dev/). Intrinsically responsive
(flex-wrap, `min()`, grid auto-fit — no media-query breakpoints), so they are
mobile-first by construction and carry no colours/fonts — they compose with any
design system's components (mix-and-match).

## Opt-in

Nothing loads unless you install this package **and** activate it:

```python
setup_components(env, design_systems=["lotc-layout", "rvo"])
```

Only then do `<c-center>`, `<c-cluster>`, `<c-sidebar>`, `<c-switcher>`,
`<c-cover>`, `<c-box>` resolve, and its `layout.css` load (via `<c-page>`).

## Primitives

| Component | Every Layout | Purpose |
| --- | --- | --- |
| `<c-grid min="16rem">` | Grid | intrinsic auto-fit grid (or `columns="three"` for fixed) |
| `<c-center max="60rem">` | Center | max-width, horizontally centred column |
| `<c-cluster gap=".5rem">` | Cluster | wrapping group (tags, buttons) |
| `<c-sidebar width="18rem">` | Sidebar | content + side column, wraps intrinsically |
| `<c-switcher threshold="30rem">` | Switcher | row that becomes a stack when narrow |
| `<c-cover min="100vh">` | Cover | fills height, centres main content |
| `<c-box pad="1rem" border>` | Box | padded container |
| `<c-bar gap="sm">` | — | horizontal bar: `start` / `center` / `end` regions (nav/toolbar) |
| `<c-layout sidebar-width="16rem">` | — | page shell: header / sidebar + main / footer |

`<c-bar>` is the alignment primitive — the "N left, M right" nav pattern. Fill
regions with `<template slot="start|center|end">`; plain children go to `start`:

```html
<c-bar gap="sm">
  <template slot="start"><a>Overzicht</a><a>Apps</a><a>Code</a></template>
  <template slot="end"><c-button type="primary" label="Nieuw"/></template>
</c-bar>
```

## Spacing scale (config)

All layout spacing comes from one overridable token scale (in `layout.css`):
`--lotc-space-3xs … --lotc-space-3xl` (xs `.5rem`, sm `.75rem`, md `1rem`, lg
`1.5rem`, …). `gap="sm|md|lg|…"` resolves to a token; a raw value (`gap="1.25rem"`)
still works per instance. Retune everything at once — or match your design
system's scale — by redefining the tokens in your own `:root`:

```css
:root { --lotc-space-md: 1.25rem; --lotc-space-lg: 2rem; }
```

`<c-grid>` is **mix-and-match**: it is also implemented by design systems that
ship their own grid (e.g. RVO). Whichever you activate first wins — with
`design_systems=["lotc-layout", "rvo"]` you get the agnostic grid; with `["rvo"]`
alone you get RVO's. Nothing is replaced.

`<c-stack>`, `<c-auto-grid>`, `<c-columns>` and `<c-app-shell>` now live here too
(they used to be always-on in core) — so the whole layout layer is a single
opt-in unit. Any page that uses them must activate `lotc-layout`.

## Example

```html
<c-center max="70rem">
  <c-sidebar width="16rem" gap="2rem">
    <nav>…</nav>
    <c-stack gap="1rem">…main…</c-stack>
  </c-sidebar>
</c-center>
```

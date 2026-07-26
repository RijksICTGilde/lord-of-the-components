# Layout primitives (theme-agnostic)

Two layout needs come up constantly and are, unlike buttons or tags, **not**
design-system specific — a grid is a grid in RVO and in NLDD. So LOTC ships them
as *theme-agnostic* structural components: one Jinja template, one stylesheet
(`static/lotc/layout.css`), rendered identically under both themes.

The research below settled which CSS technique each uses.

## 1. `<c-auto-grid>` — responsive column grid

The common ask ("show 2 or 3 columns depending on width, wrap otherwise") is the
textbook use for:

```css
grid-template-columns: repeat(auto-fit, minmax(min(VAR, 100%), 1fr));
```

- `auto-fit` creates as many tracks as fit and collapses empty ones, so the row
  fills the width.
- `minmax(min(--lotc-col-min, 100%), 1fr)` gives each column a floor width and
  lets it grow to share leftover space. The inner `min(…, 100%)` prevents
  overflow when the container is narrower than the floor.
- No media queries needed — it is intrinsically responsive.

Props: `min` (floor column width, default `16rem`), `gap` (default `1rem`),
`class`. Both tunables are passed through as CSS custom properties.

```html
<c-auto-grid min="16rem" gap="1rem">
  <c-card title="A">…</c-card>
  <c-card title="B">…</c-card>
</c-auto-grid>
```

## 2. `<c-app-shell>` — application frame

A page frame (header / sidebar / main / footer) is a different problem from a
column grid: fixed named regions, not a flowing list. The idiomatic technique is
**named grid areas**, because the region-to-cell mapping can be *completely
redefined in a media query* while the HTML stays untouched:

```css
.lotc-app-shell {
  display: grid;
  grid-template-columns: var(--lotc-sidebar-width, 16rem) 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header  header"
    "sidebar main"
    "footer  footer";
}
@media (max-width: 48rem) {         /* restack on narrow screens */
  .lotc-app-shell {
    grid-template-columns: 1fr;
    grid-template-areas: "header" "main" "sidebar" "footer";
  }
}
```

Regions come from named slots; the body is the `main` region:

```html
<c-app-shell width="16rem">
  <template slot="header">…</template>
  <template slot="sidebar">…</template>
  Main content here
  <template slot="footer">…</template>
</c-app-shell>
```

Props: `direction` (`left` | `right`, which side the sidebar sits — swaps the
area map), `width` (sidebar width → `--lotc-sidebar-width`), `class`. Absent
slots simply don't emit their region.

## Why these are RVO-impl-only (no NLDD impl)

Both are **jinja-backend** (they use named slots + inline `style` custom
properties, neither of which the Python renderer backend supports yet). A
jinja-backend component renders from a single generated template regardless of
theme, so a theme-agnostic component needs only the RVO implementation — the same
template is used for RVO and NLDD. `python/tests/test_layout_shell.py` asserts the
two themes produce byte-identical output.

The stylesheet is served in both themes (see `tests/visual/serve.py`, which
injects `/static/lotc/layout.css` for `--theme rvo` and `--theme nldd`). In a
host app, include `layout.css` alongside the theme CSS.

## Sources

- [MDN — Realizing common layouts using grids](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Realizing_common_layouts_using_grids)
- [MDN — grid-template-areas](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Grid_template_areas)
- [SitePoint — Easy and Responsive Modern CSS Grid Layout](https://www.sitepoint.com/easy-responsive-modern-css-grid-layout/)

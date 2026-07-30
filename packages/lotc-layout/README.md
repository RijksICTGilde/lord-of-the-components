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
| `<c-center max="60rem">` | Center | max-width, horizontally centred column |
| `<c-cluster gap=".5rem">` | Cluster | wrapping group (tags, buttons) |
| `<c-sidebar width="18rem">` | Sidebar | content + side column, wraps intrinsically |
| `<c-switcher threshold="30rem">` | Switcher | row that becomes a stack when narrow |
| `<c-cover min="100vh">` | Cover | fills height, centres main content |
| `<c-box pad="1rem" border>` | Box | padded container |

`<c-stack>`, `<c-auto-grid>` and `<c-columns>` (the Stack/Grid primitives) live
in core today; they will move here in a later phase so the whole layout layer is
one opt-in unit.

## Example

```html
<c-center max="70rem">
  <c-sidebar width="16rem" gap="2rem">
    <nav>…</nav>
    <c-stack gap="1rem">…main…</c-stack>
  </c-sidebar>
</c-center>
```

# Screenshots — current pipeline output

Generated with Playwright (Chromium) against `tests/visual/serve.py`, which
renders the visual fixtures through the **current** LOTC pipeline and serves them
with the bundled RVO/Utrecht CSS.

These show the **RVO theme**. The pilot components (button, heading, paragraph,
link, icon, layout-flow) render through the new **Python renderer backend** with
**constant folding**; the rest render through the Jinja backend. All output is
byte-identical (normalized) to the golden contract.

| file | shows |
|---|---|
| `combined.png` | mixed gallery: cards, links, action buttons, icons |
| `button-variants.png` | button types, sizes, states, icons, content override |
| `card-variants.png` | card layouts and variants |
| `alert-variants.png` | alert types |
| `heading-variants.png` / `typography-variants.png` | headings, paragraphs, links, strong/em |
| `breadcrumbs-variants.png` | breadcrumbs |
| `icon-variants.png` | RVO icon set |
| `menu-variants.png` | menubar |
| `layout-grid-variants.png` | grid / layout components |
| `sweep-components-rvo.png` | form inputs (text/textarea) + basic HTML (bold/italic/code/blockquote/hr) |
| `form-controls-rvo.png` | form controls: text, textarea, checkbox, radio, select |

## Both themes side by side

`form-controls-rvo.png` and `form-controls-nldd.png` render the **same**
`tests/visual/fixtures/form-controls.html` — one set of `<c-*>` definitions —
through both design systems. RVO uses native inputs styled with Utrecht/RVO CSS
classes; NLDD renders the same fields as `<nldd-text-field>`, `<nldd-checkbox-field>`,
`<nldd-radio-button-field>`, and `<nldd-combo-box>` web components. Regenerate the
NLDD shots by starting the server with `--theme nldd` (see below).

## NLDD theme

`nldd-theme.png` shows the **NLDD theme** rendered in a real browser: the same
`<c-*>` definitions render as NLDD Lit web components (`<nldd-button>`,
`<nldd-title>`, `<nldd-icon>`, …), styled by the `@nldd/design-system` bundle
(`npm run build:fe:nldd`, the nldd side of T6.5). The icon set differs
(house/star/gear are NLDD icons) — see the "semantic aliasing" phase for making
icon/color names theme-agnostic. The NLDD HTML structure is also verified by
`python/tests/nldd/`.

Regenerate the RVO shots: start `python tests/visual/serve.py --port 5599 &`,
then a Playwright script that screenshots each
`http://localhost:5599/<fixture>.html`. For NLDD, run the same server with
`--theme nldd` (it injects the `@nldd/design-system` bundle and renders fixtures
under `theme="nldd"`); wait for `:not(:defined)` to clear before screenshotting so
the web components have upgraded.

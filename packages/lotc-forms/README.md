# lotc-forms

An **opt-in capability set** of labelled form fields for Lord of the Components.
The same `<c-*-field>` markup renders a **theme-correct** field under each active
visual theme (NLDD native `nldd-form-field*`, RVO `rvo-form-field`), and guarantees
the **ARIA wiring** identically — the reason the wrapper exists.

## Why a set (not a core def, not a consumer macro)

A field frame (label + help + error + the control) is universal to every form app,
and every design system has its own opinion on how it looks. That makes it a
**per-theme** component. A hand-written macro carrying `rvo-` classes is theme-locked
for the frame — under NLDD everything looks NLDD *except* your field framing, which
defeats the theme swap. So the wrappers live here and render per active theme.
(This set can later be promoted into core; the mechanism is identical.)

## Activate — LAST, after the visual theme

```python
setup_components(env, design_systems=["lotc-layout", "nldd", "lotc-forms"])
setup_components(env, design_systems=["rvo", "lotc-forms"])
```

The visual theme (nldd/rvo) must be active so the field controls resolve to it;
`lotc-forms` goes last, like any capability set. Only then do the fields resolve.

## Components

| `<c-*>` | Renders | Notes |
| --- | --- | --- |
| `text-input-field` | text/email/tel/url/number/search input | `type` attr |
| `textarea-field` | multi-line input | `rows` |
| `select-field` | select; `<c-option>` children | `placeholder` = empty option |
| `radio-button-field` | radio group; `<c-radio>` children | `role=radiogroup` |
| `checkbox-field` | checkbox group; `<c-checkbox>` children | |
| `date-input-field` | date input | `min`/`max` |
| `file-input-field` | file input | NLDD has no native file field → renders the RVO field + a visible fallback badge |
| `fieldset` | groups fields under a legend | children = fields |
| `action-group` | a row of buttons | `align="start\|end\|between"` |

Every field takes the same base: **`id`, `name`, `label`** (+ `help`, `error`,
`required`, `disabled`, `class`). Uniform on purpose — converting existing calls is
a rename, not a redesign.

## The ARIA guarantee

For `<c-text-input-field id="voornaam" … help="…" error="…">`:

- **RVO** — `<label for="voornaam" id="voornaam-label">`, the input carries
  `aria-describedby="voornaam-help voornaam-error"` + `aria-invalid="true"`, and the
  help/error carry those ids. (roos itself omits `aria-describedby`; this set adds it.)
- **NLDD** — native `<nldd-form-field>` with `<nldd-text-field input-id="voornaam"
  error-message-ids="voornaam-error" invalid>` + `<nldd-form-field-help-text>` /
  `<nldd-form-field-error-text>`.

`aria-describedby` only ever references parts that are actually rendered.

## Conditional & dynamic attributes

You don't need conditional-attribute macros (`optional_attr`/`bool_attr`) — LOTC's
expression attributes cover it:

- **Optional value** — `:help="combined_helper(field) or none"`: an empty/`None`
  value is omitted by the field's own guard (absent vs. empty, without a wrapper).
- **Boolean** — `:required="field.required"`, `:disabled="field.readonly"`.
- **Error state** — pass `:error="…"`; the field derives `aria-invalid` from it (no
  separate `invalid` attribute).

For a whole **dynamic bundle** (htmx, arbitrary `data-*`/`aria-*`), use the spread:

```html
<c-text-input-field id="…" name="…" label="…" :attrs="htmx(field)"/>
```

`:attrs` takes a flat `{name: value}` dict and merges it onto the control. `None`
or `''` omits that entry (same rule as `:prop="… or none"`). One attribute replaces
`htmx_attrs` + `extra_attrs` — `hx-*`, `data-*`, `aria-*`, and generic HTML attrs.

## How the per-theme rendering works

Each template branches on the active visual theme via the `lotc_design_systems`
jinja global (membership test — robust regardless of declared order) and emits that
theme's native markup. Group fields (`radio-button-field`, `checkbox-field`) compose
`<c-radio>`/`<c-checkbox>` primitives, which theme-swap on their own.

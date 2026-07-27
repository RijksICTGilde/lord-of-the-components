# Semantic aliasing (icons + colors) — new phase

**Why.** Icon and color names are theme-specific: RVO uses `rvo-icon-home` /
Dutch color names, NLDD uses `house` / its own palette. Hard-coding a
theme-specific name in a template breaks the moment you switch themes. The
jinja-roos predecessor handled a lot of colors/custom-colors/icon-sets; we want
that back, but theme-agnostically: templates use **semantic names**, and a single
definition file maps each semantic name to the per-theme actual name. Migrating
to another design system is then a one-place edit.

Escape hatch: an unlisted name passes through unchanged, so a raw theme-specific
name still works.

## Icons — DONE

- `definitions/icons.ts` — `ICON_ALIASES = { semantic: { rvo, nldd } }` + `iconMapFor(theme)`.
  The single source of truth.
- Icon impls (RVO `implementations/components/icon.impl.ts`, NLDD
  `themes/nldd/components/icon.impl.ts`) resolve the `icon` prop through a
  `valueMap: "icons"` built from `iconMapFor(<theme>)`.
- Python emitter: pattern/attribute `valueMap` resolves `value` via a module dict
  (`_MAP.get(value, value)`) before use.
- Result: `<c-icon icon="home"/>` → RVO `rvo-icon-home`, NLDD `<nldd-icon name="house">`.
  `icon="favorite"` → `rvo-icon-favoriet` / `name="star"`. Raw names pass through.

Starter vocabulary: home, settings, notification, info, favorite, mail, calendar,
search. Grow `ICON_ALIASES` as components need more (the sweep, F9).

## Colors — DONE

- `definitions/colors.ts` — `COLOR_ALIASES = { semantic: { rvo, nldd } }` +
  `colorMapFor(theme)`. The single source of truth.
- Wired through a `valueMap: "colors"` on the icon-color props (same mechanism as
  icons): RVO `implementations/components/icon.impl.ts` (`color` → the
  `rvo-icon--{value}` class), NLDD `themes/nldd/components/icon.impl.ts` (`color`
  attribute), and the RVO icon spans of `button` (`color`) and `link`
  (`icon-color`).
- Result: `<c-icon color="primary"/>` → RVO `rvo-icon--hemelblauw`, NLDD
  `<nldd-icon color="accent">`; `color="muted"` → `rvo-icon--grijs-700` /
  `color="secondary-content"`. Raw names (`donkerblauw`) pass through.

Starter vocabulary: semantic `primary`, `primary-dark`, `muted`, `inverse`;
specific `hemelblauw`, `donkerblauw`, `logoblauw`.

### Constraint learned

Colour aliasing only attaches to props that resolve through a **plain `pattern`**
class or a **value attribute** — the Python emitter resolves the `valueMap` in
those branches. It does **not** resolve inside a `when`-guarded pattern (the
`when` branch keys off the raw value), so the text-colour props of `paragraph`
(`when: [...]`) and `link` (`eq: ...`) are left on their raw RVO names for now.
Converting those would need generator support for a valueMap in the `when` branch.

Tests: `python/tests/test_color_aliasing.py` (both themes + escape hatch).
Screenshots: `screenshots/color-aliasing-{rvo,nldd}.png`.

## Notes

- The mechanism (`valueMap` resolving `value` through a per-theme dict) is the
  same one already used for the NLDD heading size map — icons/colors just supply
  a centralized, shared map from `definitions/`.
- Verify names against the real sets: RVO icons under
  `@nl-rvo/assets/icons/functioneel/`; NLDD icons under
  `/home/claude/refs/storybook/src/components/content/icon/icons/`.

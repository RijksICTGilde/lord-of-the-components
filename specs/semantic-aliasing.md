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

## Colors — TODO

Same shape, `definitions/colors.ts`:

```ts
export const COLORS = {
  // semantic (preferred)
  primary:            { rvo: "hemelblauw",  nldd: "brand" },
  "primary-bg":       { rvo: "lichtblauw",  nldd: "brand-tinted" },
  // specific is allowed too (easy search/replace)
  blue:               { rvo: "hemelblauw",  nldd: "blue" },
};
export function colorMapFor(theme): Record<string,string> { ... }
```

Wire the `color` / `background-color` props of the components that take a color
through a `valueMap: "colors"` per theme (same mechanism as icons). Prefer
semantic names (`primary`, `primary-bg`, …) where the design intent is clear; a
specific `blue` alias is fine as an escape hatch.

## Notes

- The mechanism (`valueMap` resolving `value` through a per-theme dict) is the
  same one already used for the NLDD heading size map — icons/colors just supply
  a centralized, shared map from `definitions/`.
- Verify names against the real sets: RVO icons under
  `@nl-rvo/assets/icons/functioneel/`; NLDD icons under
  `/home/claude/refs/storybook/src/components/content/icon/icons/`.

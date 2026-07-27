/**
 * Semantic color vocabulary (plan v7 — semantic aliasing).
 *
 * `<c-icon color="primary"/>` uses a SEMANTIC name. Each theme resolves it to
 * its own palette here — RVO uses Dutch Rijkskleur names, NLDD uses its own
 * functional/descriptive palette — so a template never hard-codes a
 * theme-specific color. This is the single place to edit when migrating to
 * another design system.
 *
 * Prefer semantic names (`primary`, `muted`, …) where the design intent is
 * clear. Specific names (`hemelblauw`, …) are allowed as an escape hatch and, as
 * with icons, an unlisted name passes through unchanged so a raw theme color
 * still works.
 *
 * Vocabulary is intentionally constrained to values valid in BOTH themes for the
 * props it drives today (icon color). RVO icon colors are limited to six
 * modifiers (donkerblauw / grijs-700 / hemelblauw / logoblauw / wit / zwart);
 * NLDD `IconColor` adds functional names (accent / success / …). Grow the map as
 * more color-taking components are wired in.
 */

export interface ColorAlias {
  rvo: string;
  nldd: string;
}

export const COLOR_ALIASES: Record<string, ColorAlias> = {
  // ── Semantic (preferred) ──────────────────────────────────────────────────
  primary: { rvo: "hemelblauw", nldd: "accent" },
  "primary-dark": { rvo: "donkerblauw", nldd: "donkerblauw" },
  muted: { rvo: "grijs-700", nldd: "secondary-content" },
  // On a dark background. NLDD has no explicit white icon color, so it inherits
  // (empty -> the conditional attribute is omitted).
  inverse: { rvo: "wit", nldd: "" },

  // ── Specific Rijkskleuren (shared names; easy search/replace) ──────────────
  hemelblauw: { rvo: "hemelblauw", nldd: "hemelblauw" },
  donkerblauw: { rvo: "donkerblauw", nldd: "donkerblauw" },
  logoblauw: { rvo: "logoblauw", nldd: "hemelblauw" },
};

/** The `{ semantic: themeName }` map for one theme, used as a color valueMap. */
export function colorMapFor(theme: "rvo" | "nldd"): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [semantic, alias] of Object.entries(COLOR_ALIASES)) {
    out[semantic] = alias[theme];
  }
  return out;
}

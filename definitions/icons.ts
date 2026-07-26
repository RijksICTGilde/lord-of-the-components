/**
 * Semantic icon vocabulary (plan v7 — semantic aliasing).
 *
 * `<c-icon icon="home"/>` uses a SEMANTIC name. Each theme resolves it to its
 * own icon set here — RVO uses Dutch names, NLDD uses its own English set — so a
 * template never hard-codes a theme-specific icon name. This is the single place
 * to edit when migrating to another design system: add/adjust a row here and
 * every template follows.
 *
 * A name not listed passes through unchanged, so a raw theme-specific name still
 * works as an escape hatch.
 */

export interface IconAlias {
  rvo: string;
  nldd: string;
}

export const ICON_ALIASES: Record<string, IconAlias> = {
  home: { rvo: "home", nldd: "house" },
  settings: { rvo: "instellingen", nldd: "gear" },
  notification: { rvo: "bel", nldd: "bell" },
  info: { rvo: "info", nldd: "info-circle" },
  favorite: { rvo: "favoriet", nldd: "star" },
  mail: { rvo: "mail", nldd: "envelope" },
  calendar: { rvo: "kalender", nldd: "calendar-event" },
  search: { rvo: "zoek", nldd: "magnifier" },
};

/** The `{ semantic: themeName }` map for one theme, used as an icon valueMap. */
export function iconMapFor(theme: "rvo" | "nldd"): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [semantic, alias] of Object.entries(ICON_ALIASES)) {
    out[semantic] = alias[theme];
  }
  return out;
}

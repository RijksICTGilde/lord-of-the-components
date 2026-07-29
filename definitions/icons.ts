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

  // ── App/dashboard icon vocabulary ──────────────────────────────────────────
  // The recreated Begane Grond pages (Overzicht, Mijn overzicht) author icons
  // with NLDD-native names. Each row resolves that name to a real RVO sprite so
  // the SAME markup renders icons under either design system; `nldd` keeps the
  // name (identity), so NLDD output is unchanged. Add a row here — the single
  // source — whenever a theme is missing an icon a page uses.
  "apartment-building": { rvo: "flat", nldd: "apartment-building" },
  "arrow-up-arrow-down": { rvo: "gegevensuitwisseling", nldd: "arrow-up-arrow-down" },
  "books-vertical": { rvo: "boeken-achter-elkaar", nldd: "books-vertical" },
  "brackets-ellipsis": { rvo: "computercode", nldd: "brackets-ellipsis" },
  "business-suitcase": { rvo: "koffer", nldd: "business-suitcase" },
  certificate: { rvo: "diploma-certificaat", nldd: "certificate" },
  "chart-x-y-axis-line": { rvo: "grafiek", nldd: "chart-x-y-axis-line" },
  "check-list": { rvo: "klembord-met-vinkjes-en-lijnen", nldd: "check-list" },
  "check-mark-circle": { rvo: "vinkje", nldd: "check-mark-circle" },
  "chevron-left-forward-slash-chevron-right": { rvo: "computercode", nldd: "chevron-left-forward-slash-chevron-right" },
  clipboard: { rvo: "klembord-met-lijnen-met-kruis", nldd: "clipboard" },
  "clipboard-rectangle": { rvo: "klembord-met-lijnen-met-kruis", nldd: "clipboard-rectangle" },
  code: { rvo: "computercode", nldd: "code" },
  "cylinder-split": { rvo: "database", nldd: "cylinder-split" },
  database: { rvo: "database", nldd: "database" },
  envelope: { rvo: "mail", nldd: "envelope" },
  "euro-sign": { rvo: "eurobiljetten", nldd: "euro-sign" },
  "exclamation-triangle": { rvo: "let-op", nldd: "exclamation-triangle" },
  eye: { rvo: "oog", nldd: "eye" },
  eyeglasses: { rvo: "zoek", nldd: "eyeglasses" },
  "face-smiling-badge-plus": { rvo: "user", nldd: "face-smiling-badge-plus" },
  "file-text": { rvo: "document-blanco", nldd: "file-text" },
  flag: { rvo: "vlag-driehoekig", nldd: "flag" },
  "folder-stack": { rvo: "map-vol-documenten", nldd: "folder-stack" },
  gear: { rvo: "instellingen", nldd: "gear" },
  globe: { rvo: "wereldbol", nldd: "globe" },
  heart: { rvo: "hart", nldd: "heart" },
  house: { rvo: "home", nldd: "house" },
  link: { rvo: "interne-link", nldd: "link" },
  "lock-closed": { rvo: "hangslot-dicht", nldd: "lock-closed" },
  "pencil-on-square": { rvo: "bewerken", nldd: "pencil-on-square" },
  person: { rvo: "user", nldd: "person" },
  "person-2": { rvo: "personen-arm-op-schouder", nldd: "person-2" },
  "person-circle": { rvo: "user", nldd: "person-circle" },
  plus: { rvo: "plus", nldd: "plus" },
  "puzzle-piece": { rvo: "puzzel", nldd: "puzzle-piece" },
  "rectangle-stack": { rvo: "tegelweergave", nldd: "rectangle-stack" },
  "shield-check-mark": { rvo: "schild-met-vinkje-erop", nldd: "shield-check-mark" },
  "ship-wheel": { rvo: "stuurwiel", nldd: "ship-wheel" },
  sparkles: { rvo: "ster", nldd: "sparkles" },
  "square-on-square": { rvo: "kopieerapparaat", nldd: "square-on-square" },
  "starburst-filled": { rvo: "ster", nldd: "starburst-filled" },
  sun: { rvo: "zon", nldd: "sun" },
  tag: { rvo: "label", nldd: "tag" },
  terminal: { rvo: "computercode", nldd: "terminal" },
  timer: { rvo: "klok", nldd: "timer" },
};

/** The `{ semantic: themeName }` map for one theme, used as an icon valueMap. */
export function iconMapFor(theme: "rvo" | "nldd"): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [semantic, alias] of Object.entries(ICON_ALIASES)) {
    out[semantic] = alias[theme];
  }
  return out;
}

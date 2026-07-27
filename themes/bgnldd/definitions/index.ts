/**
 * BGNLDD component definitions (contracts).
 *
 * These are the app-level components Begane Grond built on top of NLDD — not in
 * NLDD proper. They live in the BGNLDD theme so core/NLDD stay clean. All are
 * jinja-backend (single-theme bespoke markup): the generator emits only their
 * registry FRAGMENT from these defs; the templates are hand-authored in the
 * lotc-bgnldd package (like page / menu-item / breadcrumbs-item).
 */
import { defineComponent } from "../../../definitions/component.js";
import { PROPS } from "../../../definitions/props.js";

// ── metric: a stat card link (icon + value + label + sub) ───────────────────
export const metric = defineComponent({
  name: "metric",
  description: "Stat/metric card link: icon + value, with a label and sub-line",
  category: "data-display",
  props: {
    [PROPS.ICON]: { description: "Icon name (semantic)" },
    [PROPS.VALUE]: { description: "The metric value (e.g. \"244\")" },
    [PROPS.LABEL]: { description: "Metric label (e.g. \"Datacenters\")" },
    sub: { description: "Sub-line under the label (e.g. \"4 operationeel\")" },
    [PROPS.HREF]: { description: "Link target for the whole card" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
});

// ── sidenav: the sidebar navigation (groups + items) ────────────────────────
export const sidenav = defineComponent({
  name: "sidenav",
  description: "Sidebar navigation container (holds sidenav-group / sidenav-item)",
  category: "navigation",
  props: { [PROPS.CLASS]: { description: "Additional CSS classes" } },
  content: { allowed: true },
});

export const sidenavGroup = defineComponent({
  name: "sidenav-group",
  description: "Uppercase section header inside a sidenav",
  category: "navigation",
  props: {
    [PROPS.LABEL]: { description: "Group label (content overrides)" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});

export const sidenavItem = defineComponent({
  name: "sidenav-item",
  description: "A sidenav link: icon + label, with an active state",
  category: "navigation",
  props: {
    [PROPS.ICON]: { description: "Icon name (semantic)" },
    [PROPS.LABEL]: { description: "Link label (content overrides)" },
    [PROPS.HREF]: { description: "Link target" },
    [PROPS.ACTIVE]: null, // boolean — current page
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});

// ── layer: a platform-layer row (icon tile + title/count + sub + chips) ──────
export const layer = defineComponent({
  name: "layer",
  description: "Platform-layer row: icon tile, title + count, sub, and chip content",
  category: "data-display",
  props: {
    [PROPS.ICON]: { description: "Icon name (semantic)" },
    [PROPS.TITLE]: { description: "Layer title (e.g. \"Applicaties\")" },
    count: { description: "Count badge (e.g. \"123 apps\")" },
    sub: { description: "Sub-line description" },
    [PROPS.HREF]: { description: "Link target for the whole row" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true }, // chips
});

// ── section-head: a card section title row with an optional right icon ──────
export const sectionHead = defineComponent({
  name: "section-head",
  description: "Card section header: title with an optional right-aligned icon",
  category: "layout",
  props: {
    [PROPS.TITLE]: { description: "Section title (content overrides)" },
    [PROPS.ICON]: { description: "Optional right-aligned icon name" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});

// ── activity: a recent-activity feed (list of activity-item) ────────────────
export const activity = defineComponent({
  name: "activity",
  description: "Recent-activity feed container (holds activity-item)",
  category: "data-display",
  props: { [PROPS.CLASS]: { description: "Additional CSS classes" } },
  content: { allowed: true },
});

export const activityItem = defineComponent({
  name: "activity-item",
  description: "One activity line: icon dot + actor + action, with a resource and time",
  category: "data-display",
  props: {
    [PROPS.ICON]: { description: "Icon name (semantic)" },
    actor: { description: "Who acted (e.g. \"Anne Schuth\")" },
    action: { description: "What they did (e.g. \"infra afgenomen\")" },
    res: { description: "Resource chip (e.g. \"llm-gilde-prod\")" },
    at: { description: "Timestamp (e.g. \"di 10:02\")" },
    [PROPS.HREF]: { description: "Optional link target for the actor" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
});

// ── shortcut: a quick-action card (icon + title + desc + cta) ───────────────
export const shortcut = defineComponent({
  name: "shortcut",
  description: "Quick-action card: icon, title, description, and a call-to-action",
  category: "actions",
  props: {
    [PROPS.ICON]: { description: "Icon name (semantic)" },
    [PROPS.TITLE]: { description: "Shortcut title" },
    desc: { description: "Short description" },
    cta: { description: "Call-to-action label" },
    [PROPS.HREF]: { description: "Link target for the whole card" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
});

// ── menu-bar: the header utility menu (Zoeken / Notificaties / … ) ──────────
export const menuBar = defineComponent({
  name: "menu-bar",
  description: "Header utility menu bar (nldd-menu-bar in the top-nav utility slot)",
  category: "navigation",
  props: {
    [PROPS.LABEL]: { description: "Accessible label (default \"Hulplinks\")" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});

export const menuBarItem = defineComponent({
  name: "menu-bar-item",
  description: "A utility menu item: text + NLDD icon, optionally expandable",
  category: "navigation",
  props: {
    [PROPS.LABEL]: { description: "Item text" },
    [PROPS.ICON]: { description: "NLDD icon name (e.g. search, envelope, plus, sun)" },
    expandable: null, // boolean — shows a disclosure chevron
    [PROPS.HREF]: { description: "Link target" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
});

/** All BGNLDD component definitions, in registry order. */
export const BGNLDD_COMPONENTS = [
  metric,
  sidenav,
  sidenavGroup,
  sidenavItem,
  layer,
  sectionHead,
  activity,
  activityItem,
  shortcut,
  menuBar,
  menuBarItem,
];

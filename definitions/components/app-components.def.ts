/**
 * Application/dashboard components — generic UI patterns (a stat metric, a
 * sidebar nav, a platform-layer row, an activity feed, a shortcut card, a
 * section header, a resource chip). These are part of the GLOBAL component set:
 * their definitions are theme-agnostic and live in core, exactly like button or
 * card, so a page can switch design systems in one go.
 *
 * A design system implements the subset it supports; where none does, the
 * emitter follows `on_missing_component` (error, or a placeholder). Today these
 * are implemented by the NLDD-adjacent BGNLDD theme (templates + CSS); an RVO
 * implementation can be added later without touching these definitions.
 */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

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
  description: "Card section header: title with an optional right-aligned icon or content",
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

// ── chip: a small monospace resource chip (used inside a layer row) ─────────
export const chip = defineComponent({
  name: "chip",
  description: "Small monospace chip/pill for a resource name (e.g. inside a layer)",
  category: "data-display",
  props: { [PROPS.CLASS]: { description: "Additional CSS classes" } },
  content: { allowed: true },
});

// ── identity: a profile/identity card (avatar + name + tags + aside) ────────
export const identity = defineComponent({
  name: "identity",
  description: "Profile/identity header: avatar initials + name, with tag content and an optional aside",
  category: "data-display",
  props: {
    name: { description: "Person's name" },
    initials: { description: "Avatar initials (e.g. \"AS\")" },
    handle: { description: "Handle/chat address (e.g. @anne:rijk.chat)" },
    "aside-tag": { description: "Aside status tag text (e.g. \"Escalatie-piket\")" },
    "aside-tag-type": { description: "Aside tag semantic type", values: ["default", "info", "success", "warning", "error"], default: "warning" },
    "aside-sub": { description: "Aside sub-line" },
    "aside-label": { description: "Aside link label" },
    "aside-href": { description: "Aside link target" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true }, // tags in the sub-line
});

// ── action: a to-do row (icon + title + sub + a right-aligned action) ───────
export const action = defineComponent({
  name: "action",
  description: "Action row: icon + title/sub, with a right-aligned action (content), and a tone",
  category: "data-display",
  props: {
    [PROPS.ICON]: { description: "Icon name (semantic)" },
    [PROPS.TITLE]: { description: "Action title" },
    sub: { description: "Sub-line" },
    tone: { description: "Left-border accent tone", values: ["neutral", "warning", "critical"], default: "neutral" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true }, // the action button/link
});

// ── detail-list: a key/value list (e.g. workplace specs) ────────────────────
export const detailList = defineComponent({
  name: "detail-list",
  description: "Key/value detail list, with an optional monospace id header",
  category: "data-display",
  props: {
    id: { description: "Monospace id shown in the header (e.g. \"wp-0001\")" },
    [PROPS.ICON]: { description: "Header icon name" },
    [PROPS.HREF]: { description: "Header link target" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true }, // detail-item rows
});

export const detailItem = defineComponent({
  name: "detail-item",
  description: "One label/value row inside a detail-list",
  category: "data-display",
  props: {
    [PROPS.LABEL]: { description: "Row label (left)" },
    [PROPS.VALUE]: { description: "Row value (right, bold)" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
});

// ── section-link: a bordered nav chip (icon + label + chevron) ──────────────
export const sectionLink = defineComponent({
  name: "section-link",
  description: "Bordered navigation chip: icon + label with a trailing chevron",
  category: "navigation",
  props: {
    [PROPS.ICON]: { description: "Icon name (semantic)" },
    [PROPS.LABEL]: { description: "Link label (content overrides)" },
    [PROPS.HREF]: { description: "Link target" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});

// ── notification: a notification feed (list of notification-item) ───────────
export const notification = defineComponent({
  name: "notification",
  description: "Notification feed container (holds notification-item)",
  category: "data-display",
  props: { [PROPS.CLASS]: { description: "Additional CSS classes" } },
  content: { allowed: true },
});

export const notificationItem = defineComponent({
  name: "notification-item",
  description: "One notification: icon + title, with meta content (tag, source, time)",
  category: "data-display",
  props: {
    [PROPS.ICON]: { description: "Icon name (semantic)" },
    [PROPS.TITLE]: { description: "Notification title" },
    [PROPS.HREF]: { description: "Optional link target" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true }, // meta line (tag + source + time)
});

// ── catalog-card: a resource/app card (icon + title/sub + status, tags, foot) ─
export const catalogCard = defineComponent({
  name: "catalog-card",
  description: "Catalog/resource card: icon + title/subtitle + status tag, a tag row, and a maturity + open footer",
  category: "data-display",
  props: {
    [PROPS.ICON]: { description: "Icon name (semantic)" },
    [PROPS.TITLE]: { description: "Card title (e.g. app name)" },
    subtitle: { description: "Sub-line under the title (e.g. owning team)" },
    status: { description: "Status tag text (e.g. \"ok\", \"warn\")" },
    "status-type": { description: "Status tag semantic type", values: ["default", "info", "success", "warning", "error"], default: "success" },
    maturity: { description: "Maturity tier medal", values: ["none", "goud", "zilver", "brons"], default: "none" },
    "open-label": { description: "Footer open-link label (e.g. \"Open\")" },
    [PROPS.HREF]: { description: "Link target for the card / open link" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true }, // the tag row (type + stack tags)
});

// ── filter-bar: a search + dropdowns toolbar (with a result count + clear) ────
export const filterBar = defineComponent({
  name: "filter-bar",
  description: "Filter toolbar: a search field, dropdown fields (content), and a result-count + clear row",
  category: "navigation",
  props: {
    [PROPS.PLACEHOLDER]: { description: "Search field placeholder" },
    "search-label": { description: "Label above the search field", default: "Zoeken" },
    count: { description: "Result-count text (e.g. \"123 van 123 applicaties\")" },
    "clear-label": { description: "Clear-filters button label" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true }, // filter-select fields
});

export const filterSelect = defineComponent({
  name: "filter-select",
  description: "A labelled dropdown field inside a filter-bar (static/display)",
  category: "navigation",
  props: {
    [PROPS.LABEL]: { description: "Field label (e.g. \"Team\")" },
    [PROPS.VALUE]: { description: "Current value shown (e.g. \"Alle teams\")" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
});

// ── site-footer: a slim page footer (legal bar + an optional centered note) ──
export const siteFooter = defineComponent({
  name: "site-footer",
  description: "Slim page footer: a legal bar (start text + end links content) with an optional centered note/action row",
  category: "layout",
  props: {
    text: { description: "Legal text on the left (e.g. copyright / disclaimer)" },
    "note-label": { description: "Centered note action label (e.g. \"Presentatie\")" },
    note: { description: "Centered note hint (monospace, e.g. a keyboard shortcut)" },
    "note-icon": { description: "Icon for the note action" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true }, // end links (right side of the legal bar)
});

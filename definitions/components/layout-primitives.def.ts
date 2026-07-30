/**
 * Layout primitives — the opt-in `lotc-layout` design system.
 *
 * A small, composable, theme-agnostic layout toolkit modelled on Every Layout
 * (every-layout.dev): intrinsically responsive (flex-wrap, min()/clamp, grid
 * auto-fit) — mobile-first WITHOUT media-query breakpoints. These are global
 * contracts; the implementation + CSS ship in the separate, opt-in `lotc-layout`
 * package (activate with design_systems=["lotc-layout", ...]). They compose with
 * any design system's components (mix-and-match).
 */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

// ── center: a max-width, horizontally-centred column ────────────────────────
export const center = defineComponent({
  name: "center",
  description: "Max-width, horizontally centred container (Every Layout: Center)",
  category: "layout",
  props: {
    max: { description: "Max inline size, e.g. '60rem' / '70ch' (--lotc-center-max)" },
    gutters: { description: "Inline padding so content never touches the edge (--lotc-center-gutters)" },
    text: null, // boolean — also centre the text
    intrinsic: null, // boolean — also centre children (align-items:center)
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});

// ── cluster: a wrapping group of inline items (tags, buttons, chips) ─────────
export const cluster = defineComponent({
  name: "cluster",
  description: "Wrapping group of inline items with a uniform gap (Every Layout: Cluster)",
  category: "layout",
  props: {
    [PROPS.GAP]: { description: "Gap between items, e.g. '0.5rem' (--lotc-cluster-gap)" },
    [PROPS.JUSTIFY]: { values: ["start", "center", "end", "between"], description: "Main-axis distribution" },
    [PROPS.ALIGN]: { values: ["start", "center", "end", "stretch"], description: "Cross-axis alignment" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});

// ── sidebar: content + a side column that wraps when the content gets narrow ─
export const sidebar = defineComponent({
  name: "sidebar",
  description: "Content + a fixed-ish side column that wraps below when space runs out (Every Layout: Sidebar)",
  category: "layout",
  props: {
    side: { values: ["left", "right"], default: "left", description: "Which side the sidebar sits on" },
    width: { description: "Ideal sidebar width, e.g. '18rem' (--lotc-sidebar-width)" },
    "content-min": { description: "Min content width before wrapping, e.g. '50%' (--lotc-sidebar-content-min)" },
    [PROPS.GAP]: { description: "Gap between the two (--lotc-sidebar-gap)" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true }, // exactly two children: sidebar + content
});

// ── switcher: a row that switches to a stack when it gets too narrow ─────────
export const switcher = defineComponent({
  name: "switcher",
  description: "Items in a row that switch to a vertical stack below a threshold width (Every Layout: Switcher)",
  category: "layout",
  props: {
    threshold: { description: "Container width at which it switches, e.g. '30rem' (--lotc-switcher-threshold)" },
    [PROPS.GAP]: { description: "Gap between items (--lotc-switcher-gap)" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});

// ── cover: fills the viewport height, centring its main content ──────────────
export const cover = defineComponent({
  name: "cover",
  description: "Min-height region that vertically centres its main content, with optional top/bottom items (Every Layout: Cover)",
  category: "layout",
  props: {
    min: { description: "Minimum block size, e.g. '100vh' / '60vh' (--lotc-cover-min)" },
    space: { description: "Padding + gap around content (--lotc-cover-space)" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true }, // the vertically-centred child carries class="lotc-cover-center"
});

// ── box: a padded container (with an optional border) ───────────────────────
export const box = defineComponent({
  name: "box",
  description: "A padded container with an optional border — the simplest layout unit (Every Layout: Box)",
  category: "layout",
  props: {
    pad: { description: "Padding, e.g. '1rem' (--lotc-box-pad)" },
    border: null, // boolean — show a 1px border in the current colour
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});

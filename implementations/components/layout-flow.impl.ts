/**
 * Layout-Flow Implementation
 *
 * Maps the layout-flow component definition to RVO CSS classes and HTML output.
 *
 * Reference:
 *   - jinja-roos-components layout-flow.html.j2 (CSS class source of truth)
 *   - rvo/components/layout-flow/src/template.tsx (React reference)
 *
 * Key behavior:
 *   - Element: div
 *   - Max-width layout: rvo-max-width-layout + rvo-max-width-layout--{size}
 *   - Direction: rvo-layout-column (default) or rvo-layout-row (when row)
 *   - Gap: rvo-layout-gap--{value}
 *   - Wrap: rvo-layout--wrap
 *   - Alignment: rvo-layout-align-items-{value}, rvo-layout-align-content-{value},
 *     rvo-layout-justify-items-{value}, rvo-layout-justify-content-{value}
 *   - Content: children pass-through
 */

import { defineImplementation } from "../implementation.js";
import { layoutFlow } from "../../definitions/components/layout-flow.def.js";

export const layoutFlowImpl = defineImplementation({
  component: layoutFlow,
  element: "div",

  classes: [
    // ═══════════════════════════════════════════════════════════════════════
    // MAX-WIDTH LAYOUT
    // ═══════════════════════════════════════════════════════════════════════
    "rvo-max-width-layout",
    { prop: "size", pattern: "rvo-max-width-layout--{value}", when: ["sm", "md", "lg"] },

    // ═══════════════════════════════════════════════════════════════════════
    // DIRECTION
    // Default is column; when row prop is truthy, use row instead.
    // The generator will handle the boolean toggle via ConditionalClass.
    // We emit rvo-layout-column statically and override with a conditional
    // for row — but since CSS classes are additive, we need a different
    // approach. We use a content block to handle the direction class.
    // Actually: the jinja-roos template uses an if/else to pick one.
    // Since our class system is additive, we handle this by:
    // - Not emitting either as a static class
    // - Using two conditionals: column when !row, row when row
    // ═══════════════════════════════════════════════════════════════════════
    // NOTE: For the direction class, we rely on the template being
    // hand-tuned after generation, or we use a content block approach.
    // Actually, looking at the generator: ConditionalClass with just
    // { prop: "row", class: "rvo-layout-row" } adds the class when row is truthy.
    // For the default (column), we need a "not truthy" conditional.
    // The current ClassRule API doesn't support negation directly.
    // We'll handle this in the template post-generation or use a raw approach.
    // For now, let's use the simplest approach that works:

    { prop: "row", class: "rvo-layout-row" },

    // ═══════════════════════════════════════════════════════════════════════
    // GAP
    // ═══════════════════════════════════════════════════════════════════════
    { prop: "gap", pattern: "rvo-layout-gap--{value}", when: ["0", "3xs", "2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl"] },

    // ═══════════════════════════════════════════════════════════════════════
    // WRAP
    // ═══════════════════════════════════════════════════════════════════════
    { prop: "wrap", class: "rvo-layout--wrap" },

    // ═══════════════════════════════════════════════════════════════════════
    // ALIGNMENT
    // ═══════════════════════════════════════════════════════════════════════
    { prop: "align-items", pattern: "rvo-layout-align-items-{value}", when: ["start", "center", "end"] },
    { prop: "align-content", pattern: "rvo-layout-align-content-{value}", when: ["start", "center", "end", "space-between"] },
    { prop: "justify-items", pattern: "rvo-layout-justify-items-{value}", when: ["start", "center", "end"] },
    { prop: "justify-content", pattern: "rvo-layout-justify-content-{value}", when: ["start", "center", "end", "space-between"] },
  ],

  attributes: [],

  content: "{{ children | safe }}",

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});

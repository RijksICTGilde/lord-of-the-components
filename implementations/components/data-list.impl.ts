/**
 * Data List Implementation
 *
 * Maps the data-list component definition to RVO CSS classes and HTML output.
 *
 * Reference:
 *   - jinja-roos-components data-list.html.j2 (CSS class source of truth)
 *   - rvo/components/data-list/src/template.tsx (React reference)
 *
 * Key behavior:
 *   - Element: dl (definition list)
 *   - Base class: rvo-data-list
 *   - Content: children passed through (dt/dd pairs)
 */

import { defineImplementation } from "../implementation.js";
import { dataList } from "../../definitions/components/data-list.def.js";

export const dataListImpl = defineImplementation({
  component: dataList,
  element: "dl",

  classes: [
    // ═══════════════════════════════════════════════════════════════════════
    // BASE CLASS
    // ═══════════════════════════════════════════════════════════════════════
    "rvo-data-list",
  ],

  content: [
    {
      template: "{{ children | safe }}",
    },
  ],

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});

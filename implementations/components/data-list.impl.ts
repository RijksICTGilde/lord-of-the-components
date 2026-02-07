/**
 * Data List Implementation (v2 — Element Tree API)
 *
 * Maps the data-list component definition to RVO CSS classes and HTML output
 * using the recursive ElementNode tree API.
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

  root: {
    element: "dl",
    isRoot: true,
    classes: ["rvo-data-list"],
    text: "{{ children | safe }}",
  },

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});

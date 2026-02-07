/**
 * Strong Implementation (v2 — Element Tree API)
 *
 * Maps the strong component definition to RVO CSS classes and HTML output
 * using the recursive ElementNode tree API.
 *
 * Key behavior:
 *   - Element: span (not <strong>, following RVO pattern)
 *   - Base class: rvo-text--bold
 *   - Content between tags overrides name prop
 */

import { defineImplementation } from "../implementation.js";
import { strong } from "../../definitions/components/strong.def.js";

export const strongImpl = defineImplementation({
  component: strong,

  root: {
    element: "span",
    isRoot: true,
    classes: ["rvo-text--bold"],
    text: "{{ children if children else name | safe }}",
  },

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});

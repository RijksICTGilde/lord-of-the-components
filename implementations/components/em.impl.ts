/**
 * Em Implementation (v2 — Element Tree API)
 *
 * Maps the em component definition to RVO CSS classes and HTML output
 * using the recursive ElementNode tree API.
 *
 * Key behavior:
 *   - Element: span (not <em>, following RVO pattern)
 *   - Base class: rvo-text--italic
 *   - Content between tags overrides name prop
 */

import { defineImplementation } from "../implementation.js";
import { em } from "../../definitions/components/em.def.js";

export const emImpl = defineImplementation({
  component: em,

  root: {
    element: "span",
    isRoot: true,
    classes: ["rvo-text--italic"],
    text: { coalesce: [{ content: true }, { prop: "label" }] },
  },

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});

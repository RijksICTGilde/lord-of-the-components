/** NLDD footer -> <nldd-page-footer> (pay-off + content in the default slot).
 *
 * nldd-page-footer has two named slots of its own: `breadcrumbs` (above the
 * footer body) and `legal-bar` (the legal sub-bar). LOTC's `<template slot="…">`
 * content is routed into them, so a page writes:
 *
 *   <c-footer>
 *     <template slot="legal-bar"><c-page-footer-legal-bar>…</template>
 *   </c-footer>
 */
import { defineImplementation } from "../../../implementations/implementation.js";
import { footer } from "../../../definitions/components/footer.def.js";

export const footerImpl = defineImplementation({
  component: footer,
  root: {
    element: "nldd-page-footer",
    isRoot: true,
    children: [
      {
        element: "div",
        when: { slot: "breadcrumbs" },
        attributes: [{ attr: "slot", type: "static", value: "breadcrumbs" }],
        text: { slot: "breadcrumbs" },
      },
      { element: "span", when: { prop: "pay-off" }, text: { prop: "pay-off" } },
      // Fragment: the content goes into nldd-page-footer's DEFAULT slot; a
      // wrapper element here would take the slot instead of the content.
      { text: { content: true } },
      {
        element: "div",
        when: { slot: "legal-bar" },
        attributes: [{ attr: "slot", type: "static", value: "legal-bar" }],
        text: { slot: "legal-bar" },
      },
    ],
  },
  mixins: { genericAttributes: true },
});

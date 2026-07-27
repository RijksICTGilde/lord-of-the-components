/** NLDD footer -> <nldd-page-footer> (pay-off + content in the default slot). */
import { defineImplementation } from "../../../implementations/implementation.js";
import { footer } from "../../../definitions/components/footer.def.js";

export const footerImpl = defineImplementation({
  component: footer,
  root: {
    element: "nldd-page-footer",
    isRoot: true,
    children: [
      { element: "span", when: { prop: "pay-off" }, text: { prop: "pay-off" } },
      { element: "div", text: { content: true } },
    ],
  },
  mixins: { genericAttributes: true },
});

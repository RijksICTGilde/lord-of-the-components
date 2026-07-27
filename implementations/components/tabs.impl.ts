/** RVO tabs — <ul class="rvo-tabs rvo-ul ..." role="tablist"> of <c-tab> items.
 * Class structure per @nl-rvo/component-library-css: rvo-tabs (on the ul) +
 * rvo-tabs__item (li) + rvo-tabs__item-link (a). */
import { defineImplementation } from "../implementation.js";
import { tabs } from "../../definitions/components/tabs.def.js";

export const tabsImpl = defineImplementation({
  component: tabs,
  root: {
    element: "ul",
    isRoot: true,
    classes: ["rvo-tabs", "rvo-ul", "rvo-ul--no-margin", "rvo-ul--no-padding"],
    attributes: [
      { attr: "role", type: "static", value: "tablist" },
      { prop: "aria-label", attr: "aria-label", type: "value", conditional: true },
    ],
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});

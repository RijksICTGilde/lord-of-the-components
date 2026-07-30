/** Tabs — a tab bar; <c-tab> items go in the content (plan v7 F9, sweep). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";
import { BINDINGS } from "../bindings.js";

export const tabs = defineComponent({
  name: "tabs",
  description: "Tab bar; fill it declaratively with <c-tab> or from data via :items",
  category: "navigation",
  props: {
    [PROPS.ARIA_LABEL]: { description: "Accessible label for the tablist" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  // Data binding: <c-tabs :items="array"/> where each item is a dict OR object
  // with label|name, href|path, active|selected (see TabItem).
  bindings: {
    items: BINDINGS.TAB_ITEMS,
  },
  content: { allowed: true },
});
export type TabsDefinition = typeof tabs;

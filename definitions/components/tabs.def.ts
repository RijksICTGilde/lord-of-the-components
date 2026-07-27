/** Tabs — a tab bar; <c-tab> items go in the content (plan v7 F9, sweep). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const tabs = defineComponent({
  name: "tabs",
  description: "Tab bar; <c-tab> items go in the content",
  category: "navigation",
  props: {
    [PROPS.ARIA_LABEL]: { description: "Accessible label for the tablist" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});
export type TabsDefinition = typeof tabs;

/** Tab — one item in a <c-tabs> bar (plan v7 F9, sweep). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const tab = defineComponent({
  name: "tab",
  description: "A single tab; label via prop or content",
  category: "navigation",
  props: {
    [PROPS.LABEL]: { description: "Tab label (content overrides)" },
    [PROPS.HREF]: { description: "Tab link target" },
    [PROPS.ACTIVE]: null,
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});
export type TabDefinition = typeof tab;

/** Badge — a small count / notification indicator (plan v7 F9, batch F). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";
import { VALUES } from "../values.js";

export const badge = defineComponent({
  name: "badge",
  description: "Small count or notification badge",
  category: "feedback",
  props: {
    [PROPS.TYPE]: { values: VALUES.TAG_TYPES, default: "default", description: "Semantic status" },
    [PROPS.LABEL]: { description: "Badge text (content overrides)" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});
export type BadgeDefinition = typeof badge;

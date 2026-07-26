/** Tag — a small labelled status chip (plan v7 F9, batch F). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";
import { VALUES } from "../values.js";

export const tag = defineComponent({
  name: "tag",
  description: "Small labelled status chip",
  category: "feedback",
  props: {
    [PROPS.TYPE]: { values: VALUES.TAG_TYPES, default: "default", description: "Semantic status" },
    [PROPS.LABEL]: { description: "Tag text (content overrides)" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});
export type TagDefinition = typeof tag;

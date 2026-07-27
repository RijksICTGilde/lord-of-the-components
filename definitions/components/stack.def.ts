/** Stack — one-dimensional flex layout with an explicit, theme-uniform direction. */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const stack = defineComponent({
  name: "stack",
  description:
    "Flex stack with an explicit direction (vertical | horizontal), enforced " +
    "uniformly across themes",
  category: "layout",
  system: true,
  props: {
    [PROPS.DIRECTION]: {
      values: ["vertical", "horizontal"],
      default: "vertical",
      description: "Main axis",
    },
    [PROPS.GAP]: { description: "Gap between items, e.g. '1rem' (CSS length)" },
    [PROPS.WRAP]: null,
    [PROPS.ALIGN]: {
      values: ["start", "center", "end", "stretch"],
      description: "Cross-axis alignment",
    },
    [PROPS.JUSTIFY]: {
      values: ["start", "center", "end", "between"],
      description: "Main-axis distribution",
    },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});
export type StackDefinition = typeof stack;

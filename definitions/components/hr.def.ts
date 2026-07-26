/** Thematic break — basic HTML element (plan v7 F9, batch D). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const hr = defineComponent({
  name: "hr",
  description: "Thematic break (horizontal rule)",
  category: "html",

  props: {
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
});

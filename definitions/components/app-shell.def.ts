/** App-shell — page frame with header/sidebar/main/footer regions (plan v7 F9, layout). */
import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const appShell = defineComponent({
  name: "app-shell",
  description:
    "Application shell layout (header / sidebar / main / footer) via named grid areas; " +
    "regions come from <template slot=\"header|sidebar|footer\">, main from the body",
  category: "layout",
  system: true,
  props: {
    // Sidebar side: "left" (default) or "right".
    [PROPS.DIRECTION]: { values: ["left", "right"], default: "left", description: "Sidebar side" },
    [PROPS.WIDTH]: { description: "Sidebar width, e.g. '16rem' (CSS length)" },
    [PROPS.CLASS]: { description: "Additional CSS classes" },
  },
  content: { allowed: true },
});
export type AppShellDefinition = typeof appShell;

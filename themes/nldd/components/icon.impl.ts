/** NLDD Icon — <nldd-icon name size color>, with semantic icon aliasing. */
import { defineImplementation } from "../../../implementations/implementation.js";
import { icon } from "../../../definitions/components/icon.def.js";
import { iconMapFor } from "../../../definitions/icons.js";
import { colorMapFor } from "../../../definitions/colors.js";

export const iconImpl = defineImplementation({
  component: icon,
  root: {
    element: "nldd-icon",
    isRoot: true,
    attributes: [
      // Semantic icon name -> NLDD icon name (definitions/icons.ts).
      { prop: "icon", attr: "name", type: "value", conditional: true, valueMap: "icons" },
      // Semantic size -> NLDD numeric spacer token. NLDD's <nldd-icon> only knows
      // size="16|20|24|..."; anything else falls back to --_size:100% (fills its
      // parent -> giant icons). Map our t-shirt sizes onto the spacer scale.
      { prop: "size", attr: "size", type: "value", conditional: true, valueMap: "sizes" },
      // Semantic color name -> NLDD color name (definitions/colors.ts).
      { prop: "color", attr: "color", type: "value", conditional: true, valueMap: "colors" },
    ],
  },
  valueMaps: {
    icons: iconMapFor("nldd"),
    colors: colorMapFor("nldd"),
    sizes: {
      "2xs": "16",
      xs: "16",
      sm: "20",
      md: "24",
      lg: "32",
      xl: "40",
      "2xl": "48",
      "3xl": "64",
      "4xl": "96",
    },
  },
  mixins: { genericAttributes: true },
});

/** NLDD Icon — <nldd-icon name size color>, with semantic icon aliasing. */
import { defineImplementation } from "../../../implementations/implementation.js";
import { icon } from "../../../definitions/components/icon.def.js";
import { iconMapFor } from "../../../definitions/icons.js";

export const iconImpl = defineImplementation({
  component: icon,
  root: {
    element: "nldd-icon",
    isRoot: true,
    attributes: [
      // Semantic icon name -> NLDD icon name (definitions/icons.ts).
      { prop: "icon", attr: "name", type: "value", conditional: true, valueMap: "icons" },
      { prop: "size", attr: "size", type: "value", conditional: true },
      { prop: "color", attr: "color", type: "value", conditional: true },
    ],
  },
  valueMaps: { icons: iconMapFor("nldd") },
  mixins: { genericAttributes: true },
});

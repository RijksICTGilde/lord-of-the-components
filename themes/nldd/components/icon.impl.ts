/** NLDD Icon — <nldd-icon name size color>. */
import { defineImplementation } from "../../../implementations/implementation.js";
import { icon } from "../../../definitions/components/icon.def.js";

export const iconImpl = defineImplementation({
  component: icon,
  root: {
    element: "nldd-icon",
    isRoot: true,
    attributes: [
      { prop: "icon", attr: "name", type: "value", conditional: true },
      { prop: "size", attr: "size", type: "value", conditional: true },
      { prop: "color", attr: "color", type: "value", conditional: true },
    ],
  },
  mixins: { genericAttributes: true },
});

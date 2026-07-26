/** NLDD select -> <nldd-combo-box> with an <nldd-menu> of <nldd-menu-item>s.
 * The combo-box expects an nldd-menu in its default slot; <c-option> children
 * render to the nldd-menu-item elements it lists. */
import { defineImplementation } from "../../../implementations/implementation.js";
import { select } from "../../../definitions/components/select.def.js";

export const selectImpl = defineImplementation({
  component: select,
  root: {
    element: "nldd-combo-box",
    isRoot: true,
    attributes: [
      { prop: "name", attr: "name", type: "value", conditional: true },
      { prop: "value", attr: "value", type: "value", conditional: true },
      { prop: "placeholder", attr: "placeholder", type: "value", conditional: true },
      { prop: "disabled", attr: "disabled", type: "boolean" },
    ],
    children: [
      {
        element: "nldd-menu",
        text: { content: true },
      },
    ],
  },
  mixins: { genericAttributes: true },
});

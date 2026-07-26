/**
 * NLDD Button — maps <c-button> to <nldd-button> (plan v7 F6 / T6.2).
 * Source of truth: ../storybook/custom-elements.json. The label goes via the
 * `text` attribute (not content); content becomes the default slot body.
 */
import { defineImplementation } from "../../../implementations/implementation.js";
import { button } from "../../../definitions/components/button.def.js";

export const buttonImpl = defineImplementation({
  component: button,
  root: {
    element: "nldd-button",
    isRoot: true,
    attributes: [
      { prop: "type", attr: "variant", type: "value", conditional: true },
      { prop: "size", attr: "size", type: "value", conditional: true },
      { prop: "label", attr: "text", type: "value", conditional: true },
      { prop: "html-type", attr: "type", type: "value", conditional: true },
      { prop: "disabled", attr: "disabled", type: "boolean" },
      { prop: "href", attr: "href", type: "value", conditional: true },
      { prop: "target", attr: "target", type: "value", conditional: true },
    ],
    text: { content: true },
  },
  mixins: { genericAttributes: true },
});

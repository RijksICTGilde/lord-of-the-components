/**
 * NLDD Button — maps <c-button> to <nldd-button> (plan v7 F6 / T6.2).
 * Source of truth: ../storybook/custom-elements.json. The label goes via the
 * `text` attribute (not content); content becomes the default slot body.
 */
import { defineImplementation } from "../../../implementations/implementation.js";
import { button } from "../../../definitions/components/button.def.js";
import { iconMapFor } from "../../../definitions/icons.js";

export const buttonImpl = defineImplementation({
  component: button,
  root: {
    element: "nldd-button",
    isRoot: true,
    attributes: [
      // LOTC's semantic button type -> NLDD variant (see button.ts Variant union).
      { prop: "type", attr: "variant", type: "value", conditional: true, valueMap: "variant" },
      { prop: "size", attr: "size", type: "value", conditional: true },
      { prop: "label", attr: "text", type: "value", conditional: true },
      { prop: "html-type", attr: "type", type: "value", conditional: true },
      { prop: "disabled", attr: "disabled", type: "boolean" },
      { prop: "href", attr: "href", type: "value", conditional: true },
      { prop: "target", attr: "target", type: "value", conditional: true },
      // Icon -> start-icon / end-icon, selected by show-icon (semantic icon name
      // resolved to the NLDD icon set). RVO puts the icon in a <span>; NLDD uses
      // the button's own start-icon/end-icon attributes.
      {
        prop: "icon",
        attr: "start-icon",
        type: "value",
        valueMap: "icons",
        when: { prop: "show-icon", eq: "before" },
      },
      {
        prop: "icon",
        attr: "end-icon",
        type: "value",
        valueMap: "icons",
        when: { prop: "show-icon", eq: "after" },
      },
    ],
    text: { content: true },
  },
  valueMaps: {
    icons: iconMapFor("nldd"),
    variant: {
      primary: "primary",
      secondary: "secondary",
      tertiary: "neutral-transparent",
      quaternary: "neutral-base",
      warning: "destructive",
      subtle: "neutral-tinted",
      "warning-subtle": "critical-tinted",
    },
  },
  mixins: { genericAttributes: true },
});

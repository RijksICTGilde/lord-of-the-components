/** NLDD header -> <nldd-top-navigation-bar> (logo title/subtitle + website link). */
import { defineImplementation } from "../../../implementations/implementation.js";
import { header } from "../../../definitions/components/header.def.js";

export const headerImpl = defineImplementation({
  component: header,
  root: {
    element: "nldd-top-navigation-bar",
    isRoot: true,
    attributes: [
      { prop: "text", attr: "logo-title", type: "value", conditional: true },
      { prop: "subtitle", attr: "logo-subtitle", type: "value", conditional: true },
      { prop: "link", attr: "website-href", type: "value", conditional: true },
    ],
  },
  mixins: { genericAttributes: true },
});

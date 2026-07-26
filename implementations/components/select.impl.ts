/** RVO select — native <select class="utrecht-select"> inside an rvo-select-wrapper.
 * The wrapper draws the chevron; utrecht-select fills it (inline-size:100%) so the
 * chevron overlays the control. Options are supplied as content. */
import { defineImplementation } from "../implementation.js";
import { select } from "../../definitions/components/select.def.js";

export const selectImpl = defineImplementation({
  component: select,
  root: {
    element: "div",
    isRoot: true,
    classes: ["rvo-select-wrapper"],
    children: [
      {
        element: "select",
        classes: [
          "utrecht-select",
          "utrecht-select--html-select",
          { prop: "disabled", class: "utrecht-select--disabled" },
        ],
        attributes: [
          { prop: "name", attr: "name", type: "value", conditional: true },
          { prop: "disabled", attr: "disabled", type: "boolean" },
          { prop: "required", attr: "required", type: "boolean" },
        ],
        text: { content: true },
      },
    ],
  },
  mixins: { genericAttributes: true },
});

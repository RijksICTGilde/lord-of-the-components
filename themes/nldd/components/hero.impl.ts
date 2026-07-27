/** NLDD hero -> <nldd-hero> (media from image; title/subtitle via nldd-title in the main slot). */
import { defineImplementation } from "../../../implementations/implementation.js";
import { hero } from "../../../definitions/components/hero.def.js";

export const heroImpl = defineImplementation({
  component: hero,
  root: {
    element: "nldd-hero",
    isRoot: true,
    attributes: [
      { prop: "image", attr: "media-src", type: "value", conditional: true },
      { prop: "image-alt", attr: "media-alt", type: "value", conditional: true },
    ],
    children: [
      {
        element: "nldd-title",
        children: [
          { element: "span", text: { prop: "title" } },
          { element: "span", when: { prop: "subtitle" }, attributes: [{ attr: "slot", type: "static", value: "subtitle" }], text: { prop: "subtitle" } },
        ],
      },
      { element: "div", text: { content: true } },
    ],
  },
  mixins: { genericAttributes: true },
});

/**
 * Hero Implementation (v2 — Element Tree API)
 *
 * Maps the hero component definition to RVO CSS classes and HTML output
 * using the recursive ElementNode tree API.
 *
 * Key behavior:
 *   - Element: section
 *   - Base class: rvo-hero
 *   - Size: rvo-hero--{size} (sm, md, lg)
 *   - Image: rvo-hero--with-image when image prop set
 *   - Overlay: rvo-hero--overlay boolean
 *   - Nested structure: optional image container + content (title h1, subtitle p, children div)
 */

import { defineImplementation } from "../implementation.js";
import { hero } from "../../definitions/components/hero.def.js";

export const heroImpl = defineImplementation({
  component: hero,

  root: {
    element: "section",
    isRoot: true,

    classes: [
      "rvo-hero",
      { prop: "size", pattern: "rvo-hero--{value}", when: ["sm", "md", "lg"] },
      { prop: "image", class: "rvo-hero--with-image" },
      { prop: "overlay", class: "rvo-hero--overlay" },
    ],

    children: [
      // Image container (conditional on image prop)
      {
        element: "div",
        when: { prop: "image" },
        classes: ["rvo-hero__image-container"],
        children: [
          {
            element: "img",
            attributes: [
              { prop: "image", attr: "src", type: "value" },
              { prop: "image-alt", attr: "alt", type: "value" },
            ],
            classes: ["rvo-hero__image"],
          },
        ],
      },
      // Content section (conditional on title OR subtitle OR children)
      {
        element: "div",
        when: { or: [{ prop: "title" }, { prop: "subtitle" }, { prop: "children" }] },
        classes: ["rvo-hero__content"],
        children: [
          {
            element: "h1",
            when: { prop: "title" },
            classes: ["utrecht-heading-1", "rvo-hero__title"],
            text: "{{ title }}",
          },
          {
            element: "p",
            when: { prop: "subtitle" },
            classes: ["rvo-hero__subtitle", "rvo-text--lg"],
            text: "{{ subtitle }}",
          },
          {
            element: "div",
            when: { prop: "children" },
            classes: ["rvo-hero__text"],
            text: "{{ children | safe }}",
          },
        ],
      },
    ],
  },

  mixins: {
    utilityClasses: false,
    genericAttributes: true,
  },
});

/**
 * Card Implementation (v2 — Element Tree API)
 *
 * Maps the card component definition to RVO CSS classes and HTML output
 * using the recursive ElementNode tree API.
 *
 * Key behavior:
 *   - Element: div
 *   - Complex conditional class logic:
 *     - rvo-card--with-image when image AND NOT inline-image
 *     - rvo-card--with-image-{size} when image AND image-size AND NOT inline-image
 *     - rvo-card--outline when outline AND NOT background-image
 *     - rvo-card--padding-{value} when (outline OR background-color) AND padding != none
 *     - rvo-card--with-background-image when background-image
 *   - Computed var: has_link_indicator = show-link-indicator AND href AND full-card-link
 *   - Nested structure:
 *     1. Optional background image container
 *     2. Optional image container (when image and not inline)
 *     3. Optional link indicator wrapper
 *     4. Content div with optional inline image, title, children
 *     5. Optional link indicator icon
 */

import { defineImplementation } from "../implementation.js";
import { card } from "../../definitions/components/card.def.js";

export const cardImpl = defineImplementation({
  component: card,

  computedVars: [
    {
      name: "has_link_indicator",
      condition: { and: [{ prop: "show-link-indicator" }, { prop: "href" }, { prop: "full-card-link" }] },
    },
    {
      name: "has_image",
      condition: { and: [{ prop: "image" }, { not: { prop: "inline-image" } }] },
    },
    {
      name: "has_outline",
      condition: { and: [{ prop: "outline" }, { not: { prop: "background-image" } }] },
    },
    {
      name: "has_padding",
      condition: { or: [{ prop: "outline" }, { prop: "background-color" }] },
    },
  ],

  root: {
    element: "div",
    isRoot: true,

    classes: [
      "rvo-card",
      { prop: "has_image", class: "rvo-card--with-image" },
      { prop: "image-size", pattern: "rvo-card--with-image-{value}", guard: { prop: "has_image" } },
      { prop: "has_outline", class: "rvo-card--outline" },
      { prop: "padding", pattern: "rvo-card--padding-{value}", when: ["sm", "md", "lg", "xl"], guard: { prop: "has_padding" } },
      { prop: "background-image", class: "rvo-card--with-background-image" },
      { prop: "inverted-colors", class: "rvo-card--inverted-colors" },
    ],

    children: [
      // Background image container
      {
        element: "div",
        when: { prop: "background-image" },
        classes: ["rvo-card__background-image-container"],
        children: [
          {
            element: "img",
            attributes: [
              { prop: "background-image", attr: "src", type: "value" },
              { attr: "class", type: "static", value: "rvo-card__background-image" },
              { attr: "alt", type: "static", value: "" },
            ],
          },
        ],
      },
      // Image container (when image AND NOT inline-image)
      {
        element: "div",
        when: { and: [{ prop: "image" }, { not: { prop: "inline-image" } }] },
        classes: [
          "rvo-card__image-container",
          { prop: "layout", eq: "row", class: "rvo-card__image-container--row" },
        ],
        children: [
          {
            element: "img",
            attributes: [
              { prop: "image", attr: "src", type: "value" },
              { prop: "image-alt", attr: "alt", type: "value" },
            ],
            classes: [
              "rvo-card__image",
              { prop: "image-size", pattern: "rvo-card-img--{value}" },
            ],
          },
        ],
      },
      // Link indicator wrapper (open)
      {
        element: "div",
        when: { prop: "has_link_indicator" },
        classes: ["rvo-card--with-link-indicator"],
        children: [
          // Content div
          {
            element: "div",
            classes: [
              "rvo-card__content",
              { prop: "layout", eq: "row", class: "rvo-layout-row" },
              { prop: "layout", eq: "row", class: "rvo-layout-align-content-center" },
              { prop: "layout", eq: "row", class: "rvo-layout-gap--md" },
            ],
            children: [
              // Inline image (when image AND inline-image AND layout=row)
              {
                element: "img",
                when: { and: [{ prop: "image" }, { prop: "inline-image" }, { prop: "layout", eq: "row" }] },
                attributes: [
                  { prop: "image", attr: "src", type: "value" },
                  { prop: "image-alt", attr: "alt", type: "value" },
                ],
                classes: [
                  "rvo-card__image",
                  { prop: "image-size", pattern: "rvo-card-img--{value}" },
                ],
              },
              // Title
              {
                element: "h3",
                when: { prop: "title" },
                classes: ["utrecht-heading-3"],
                children: [
                  {
                    element: "a",
                    when: { prop: "href" },
                    classes: [
                      // The RVO card renders its linked title via the Link
                      // component (rvo-link); there is no rvo-card__link class,
                      // so a bare one falls back to the default browser link.
                      "rvo-link",
                      { prop: "full-card-link", class: "rvo-card__full-card-link" },
                    ],
                    attributes: [
                      { prop: "href", attr: "href", type: "value" },
                    ],
                    text: { prop: "title" },
                    elseChildren: [
                      {
                        element: "span",
                        text: { prop: "title" },
                      },
                    ],
                  },
                ],
              },
              // Children content
              {
                element: "span",
                when: { prop: "children" },
                text: "{{ children | safe }}",
              },
            ],
          },
          // Link indicator icon. Needs the utrecht-icon base class (it carries the
          // size via --utrecht-icon-size); the icon-name class is single-dash
          // (rvo-icon-<name>), not the double-dash modifier form.
          {
            element: "span",
            classes: ["utrecht-icon", "rvo-icon", "rvo-icon-delta-naar-rechts", "rvo-icon--sm", "rvo-card__link-indicator"],
            attributes: [
              { attr: "aria-label", type: "static", value: "Delta naar rechts" },
              { attr: "role", type: "static", value: "img" },
            ],
          },
        ],
        // When NO link indicator — render content without wrapper
        elseChildren: [
          {
            element: "div",
            classes: [
              "rvo-card__content",
              { prop: "layout", eq: "row", class: "rvo-layout-row" },
              { prop: "layout", eq: "row", class: "rvo-layout-align-content-center" },
              { prop: "layout", eq: "row", class: "rvo-layout-gap--md" },
            ],
            children: [
              // Inline image (when image AND inline-image AND layout=row)
              {
                element: "img",
                when: { and: [{ prop: "image" }, { prop: "inline-image" }, { prop: "layout", eq: "row" }] },
                attributes: [
                  { prop: "image", attr: "src", type: "value" },
                  { prop: "image-alt", attr: "alt", type: "value" },
                ],
                classes: [
                  "rvo-card__image",
                  { prop: "image-size", pattern: "rvo-card-img--{value}" },
                ],
              },
              // Title
              {
                element: "h3",
                when: { prop: "title" },
                classes: ["utrecht-heading-3"],
                children: [
                  {
                    element: "a",
                    when: { prop: "href" },
                    classes: [
                      // The RVO card renders its linked title via the Link
                      // component (rvo-link); there is no rvo-card__link class,
                      // so a bare one falls back to the default browser link.
                      "rvo-link",
                      { prop: "full-card-link", class: "rvo-card__full-card-link" },
                    ],
                    attributes: [
                      { prop: "href", attr: "href", type: "value" },
                    ],
                    text: { prop: "title" },
                    elseChildren: [
                      {
                        element: "span",
                        text: { prop: "title" },
                      },
                    ],
                  },
                ],
              },
              // Children content
              {
                element: "span",
                when: { prop: "children" },
                text: "{{ children | safe }}",
              },
            ],
          },
        ],
      },
      // Named-slot footer (plan v7 F5 / T5.3): rendered only when a
      // <template slot="footer"> is supplied.
      {
        element: "div",
        classes: ["rvo-card__footer"],
        when: { prop: "slots.footer" },
        text: { slot: "footer" },
      },
    ],
  },

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});

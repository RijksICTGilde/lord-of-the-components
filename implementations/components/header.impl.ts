/**
 * Header Implementation (v2 — Element Tree API)
 *
 * Maps the header component definition to RVO CSS classes and HTML output
 * using the recursive ElementNode tree API.
 *
 * Key behavior:
 *   - Element: header
 *   - Base class: rvo-header
 *   - Inner structure: logo wrapper > logo link > logo (emblem SVG + wordmark text)
 *   - Props: text (org name), subtitle, link (logo href)
 *   - Children content rendered after logo wrapper
 *   - Embedded Rijksoverheid SVG logo via rawHtml
 */

import { defineImplementation } from "../implementation.js";
import { header } from "../../definitions/components/header.def.js";

const RIJKSOVERHEID_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -12 44 88" role="img">
    <title>Logo Rijksoverheid</title>
    <rect x="0" y="-12" fill="var(--rvo-logo-emblem-background-color, #154273)" width="44" height="88"></rect>
    <path fill="var(--rvo-logo-emblem-color, #FFFFFF)" d="M22.764,56.35h-0.765v-2.123h0.765V56.35z M26.214,46.997h-0.765v-2.123h0.765V46.997z M12.048,43.336 c-0.058,0-0.455,0.002-0.455,0.084s0.184,0.041,0.455,0.084c0.611,0.105,0.854,0.414,1.283,0.414c0.39,0,0.789-0.266,0.635-0.828 c-0.026-0.094-0.083-0.072-0.094-0.008c-0.061,0.25-0.371,0.396-0.697,0.396C12.771,43.479,12.685,43.336,12.048,43.336z"></path>
</svg>`;

export const headerImpl = defineImplementation({
  component: header,

  root: {
    element: "header",
    isRoot: true,
    classes: ["rvo-header"],

    children: [
      // Logo wrapper
      {
        element: "div",
        classes: ["rvo-header__logo-wrapper"],
        children: [
          // Logo link
          {
            element: "a",
            attributes: [
              { prop: "link", attr: "href", type: "value" },
            ],
            classes: ["rvo-header__logo-link", "rvo-link", "rvo-link--no-underline"],
            children: [
              // Logo container
              {
                element: "div",
                classes: ["rvo-logo", "rvo-header__logo-img"],
                children: [
                  // Emblem (SVG)
                  {
                    element: "div",
                    classes: ["rvo-logo__emblem"],
                    rawHtml: RIJKSOVERHEID_SVG,
                  },
                  // Wordmark
                  {
                    element: "div",
                    classes: ["rvo-logo__wordmark"],
                    children: [
                      {
                        element: "p",
                        when: { prop: "text" },
                        classes: ["rvo-logo__title"],
                        text: "{{ text }}",
                      },
                      {
                        element: "p",
                        when: { prop: "subtitle" },
                        classes: ["rvo-logo__subtitle"],
                        text: "{{ subtitle }}",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      // Children content after logo wrapper
      {
        element: "span",
        when: { prop: "children" },
        text: "{{ children | safe }}",
      },
    ],
  },

  mixins: {
    utilityClasses: false,
    genericAttributes: true,
  },
});

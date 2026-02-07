/**
 * Card Implementation
 *
 * Maps the card component definition to RVO CSS classes and HTML output.
 *
 * Reference:
 *   - jinja-roos-components card.html.j2 (CSS class source of truth)
 *   - rvo/components/card/src/template.tsx (React reference)
 *
 * Prop name mapping (LOTC kebab-case → jinja-roos camelCase):
 *   image-alt → imageAlt, image-size → imageSize, inline-image → inlineImage,
 *   full-card-link → fullCardLink, show-link-indicator → showLinkIndicator,
 *   background-color → backgroundColor, background-image → backgroundImage,
 *   inverted-colors → invertedColors
 *
 * Key behavior:
 *   - Element: div
 *   - Conditional image section (when image is truthy and not inline-image)
 *   - Content div with optional title (with optional link wrapping)
 *   - Link indicator when show-link-indicator && href && full-card-link
 */

import { defineImplementation } from "../implementation.js";
import { card } from "../../definitions/components/card.def.js";

export const cardImpl = defineImplementation({
  component: card,
  element: "div",

  classes: [
    // ═══════════════════════════════════════════════════════════════════════
    // BASE CLASS
    // ═══════════════════════════════════════════════════════════════════════
    "rvo-card",

    // ═══════════════════════════════════════════════════════════════════════
    // IMAGE MODIFIER CLASSES
    // Image + not inline → with-image class and image size class
    // These are applied conditionally in the template via complex logic
    // handled by content blocks, but we add the basic image class here
    // ═══════════════════════════════════════════════════════════════════════
    { prop: "outline", class: "rvo-card--outline" },
    { prop: "inverted-colors", class: "rvo-card--inverted-colors" },

    // ═══════════════════════════════════════════════════════════════════════
    // PADDING (only when outline or background-color is set)
    // ═══════════════════════════════════════════════════════════════════════
    { prop: "padding", pattern: "rvo-card--padding-{value}", when: ["sm", "md", "lg", "xl"] },
  ],

  attributes: [],

  // The card template has complex nested structure that can't be fully expressed
  // with simple ContentBlock conditions. We use raw Jinja2 template strings
  // that contain the conditional logic directly.
  content: [
    // ── Image container (not inline) ────────────────────────────────────
    {
      template: '\n    <div class="rvo-card__image-container{% if layout == \'row\' %} rvo-card__image-container--row{% endif %}">\n        <img src="{{ image }}" class="rvo-card__image{% if image_size %} rvo-card-img--{{ image_size }}{% endif %}" alt="{{ image_alt }}" />\n    </div>',
      when: { prop: "image", truthy: true },
    },
    // ── Content container ────────────────────────────────────────────────
    // The content container is always rendered. It includes:
    // - Optional inline image (for row layout)
    // - Optional title (with optional link wrapping)
    // - Children content
    {
      template: '\n    <div class="rvo-card__content{% if layout == \'row\' %} rvo-layout-row rvo-layout-align-content-center rvo-layout-gap--md{% endif %}">\n        {% if title %}\n        <h3 class="utrecht-heading-3">\n            {% if href %}<a href="{{ href }}" class="rvo-card__link{% if full_card_link %} rvo-card__full-card-link{% endif %}">{{ title | safe }}</a>{% else %}{{ title | safe }}{% endif %}\n        </h3>\n        {% endif %}\n        {% if children %}{{ children | safe }}{% endif %}\n    </div>',
    },
  ],

  mixins: {
    utilityClasses: true,
    genericAttributes: true,
  },
});

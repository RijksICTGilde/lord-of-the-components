/**
 * Card Component Definition
 *
 * Content container with optional image, title, and link.
 * Aligned with the RVO card component (jinja-roos-components card.html.j2).
 *
 * Usage:
 *   <c-card title="My Card">Card content here</c-card>
 *   <c-card title="Featured" image="/image.jpg" href="/details">
 *     Click to view details
 *   </c-card>
 *   <c-card layout="row" image="/thumb.jpg" title="Article">
 *     Horizontal card layout
 *   </c-card>
 *   <c-card title="Link" href="/page" full-card-link show-link-indicator>
 *     Full card link with indicator
 *   </c-card>
 */

import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";
import { VALUES } from "../values.js";
import { EVENTS } from "../events.js";

export const card = defineComponent({
  name: "card",
  description: "Content container with optional image and link",
  category: "data-display",

  props: {
    // ═══════════════════════════════════════════════════════════════════════
    // CONTENT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Card title/heading (rendered as h3)
     */
    [PROPS.TITLE]: {
      description: "Card title/heading",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // IMAGE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Card image URL
     */
    [PROPS.IMAGE]: {
      description: "Card image URL",
    },

    /**
     * Image alt text
     */
    [PROPS.IMAGE_ALT]: {
      description: "Image alt text for accessibility",
    },

    /**
     * Image size
     * @default "md"
     */
    [PROPS.IMAGE_SIZE]: {
      values: VALUES.IMAGE_SIZES,
      default: "md",
      description: "Image size (sm or md)",
    },

    /**
     * Whether to render image inline (inside content container)
     */
    [PROPS.INLINE_IMAGE]: null, // boolean

    // ═══════════════════════════════════════════════════════════════════════
    // LAYOUT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Card layout direction
     * @default "column"
     */
    [PROPS.LAYOUT]: {
      values: VALUES.CARD_LAYOUTS,
      default: "column",
      description: "Card layout: column (vertical) or row (horizontal)",
    },

    /**
     * Content padding
     * @default "md"
     */
    [PROPS.PADDING]: {
      values: VALUES.CARD_PADDING,
      default: "md",
      description: "Content padding size",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // LINK BEHAVIOR
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Link URL for the card title
     */
    [PROPS.HREF]: {
      description: "Link URL for the card title",
    },

    /**
     * Whether the entire card is clickable as a link
     */
    [PROPS.FULL_CARD_LINK]: null, // boolean

    /**
     * Whether to show a link indicator (delta arrow icon)
     */
    [PROPS.SHOW_LINK_INDICATOR]: null, // boolean

    // ═══════════════════════════════════════════════════════════════════════
    // STYLING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Background color (named RVO color or hex)
     */
    [PROPS.BACKGROUND_COLOR]: {
      description: "Background color (named RVO color or hex value)",
    },

    /**
     * Background image URL
     */
    [PROPS.BACKGROUND_IMAGE]: {
      description: "Background image URL",
    },

    /**
     * Whether to show card outline/border
     */
    outline: null, // boolean

    /**
     * Whether to invert colors (for dark backgrounds)
     */
    [PROPS.INVERTED_COLORS]: null, // boolean

    /**
     * Additional CSS classes
     */
    [PROPS.CLASS]: {
      description: "Additional CSS classes",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Supported events:
   *   @click - Card clicked (when href is not set)
   */
  events: [EVENTS.CLICK],

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  content: {
    allowed: true,
    description: "Card body content",
  },
});

// Export type for the card definition
export type CardDefinition = typeof card;

/**
 * Breadcrumbs Component Definition
 *
 * Navigation breadcrumb trail. Supports declarative child items:
 *   <c-breadcrumbs>
 *     <c-breadcrumbs-item name="Home" href="/"/>
 *     <c-breadcrumbs-item name="Products" href="/products"/>
 *     <c-breadcrumbs-item name="Current page"/>
 *   </c-breadcrumbs>
 *
 * Child component <c-breadcrumbs-item> can ONLY be used inside <c-breadcrumbs>.
 * Items without href render as current page (span, not link).
 * Arrow divider icons are rendered between items automatically.
 */

import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";
import { VALUES } from "../values.js";
import { EVENTS } from "../events.js";

export const breadcrumbs = defineComponent({
  name: "breadcrumbs",
  description: "Breadcrumb navigation trail",
  category: "navigation",

  props: {
    // ═══════════════════════════════════════════════════════════════════════
    // APPEARANCE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Size variant
     * @default "sm"
     */
    [PROPS.SIZE]: {
      values: VALUES.BREADCRUMBS_SIZES,
      default: "sm",
      description: "Breadcrumbs size",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ACCESSIBILITY
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Accessible label for the breadcrumb navigation
     */
    [PROPS.ARIA_LABEL]: {
      description: "Accessible label for the breadcrumb navigation",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // STYLING ESCAPE HATCH
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Additional CSS classes
     */
    [PROPS.CLASS]: {
      description: "Additional CSS classes",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  content: {
    allowed: true,
    description: "Breadcrumb items",
    allowedChildren: ["breadcrumbs-item"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHILD COMPONENTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * <c-breadcrumbs-item> - Individual breadcrumb item
   *
   * Can ONLY be used inside <c-breadcrumbs>.
   * Items with href render as links; without href, render as current page span.
   */
  children: {
    "breadcrumbs-item": {
      name: "breadcrumbs-item",
      description:
        "Individual breadcrumb item (only valid inside <c-breadcrumbs>)",

      props: {
        /**
         * Item label (required)
         */
        [PROPS.LABEL]: {
          required: true,
          description: "Breadcrumb item label text",
        },

        /**
         * Link URL (optional - omit for current page)
         */
        [PROPS.HREF]: {
          description: "Link URL (omit for current page)",
        },

        /**
         * Additional CSS classes
         */
        [PROPS.CLASS]: {
          description: "Additional CSS classes",
        },
      },

      /**
       * Supported events:
       *   @click - Item clicked
       */
      events: [EVENTS.CLICK],

      content: {
        allowed: false,
        description: "No content — label comes from name prop",
      },
    },
  },
});

// Export type for the breadcrumbs definition
export type BreadcrumbsDefinition = typeof breadcrumbs;

/**
 * Menu Component Definition
 *
 * Navigation menu with items. Supports both:
 *   - Data binding: <c-menu :items="menuData"/>
 *   - Declarative: <c-menu><c-menu-item name="Home" href="/"/></c-menu>
 *
 * Child component <c-menu-item> can ONLY be used inside <c-menu>.
 *
 * Usage:
 *   <!-- With binding -->
 *   <c-menu type="horizontal" :items="menuData"/>
 *
 *   <!-- Declarative -->
 *   <c-menu type="horizontal">
 *     <c-menu-item name="Home" href="/"/>
 *     <c-menu-item name="Products">
 *       <c-menu-item name="Widget A" href="/products/a"/>
 *       <c-menu-item name="Widget B" href="/products/b"/>
 *     </c-menu-item>
 *   </c-menu>
 */

import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";
import { VALUES } from "../values.js";
import { EVENTS } from "../events.js";
import { BINDINGS } from "../bindings.js";

export const menu = defineComponent({
  name: "menu",
  description: "Navigation menu with items",
  category: "navigation",

  props: {
    // ═══════════════════════════════════════════════════════════════════════
    // APPEARANCE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Menu layout direction
     * @default "horizontal"
     */
    [PROPS.TYPE]: {
      values: VALUES.MENU_TYPES,
      default: "horizontal",
      description: "Menu layout: horizontal or vertical",
    },

    /**
     * Size variant
     */
    [PROPS.SIZE]: {
      values: VALUES.SIZES,
      default: "md",
      description: "Menu size",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ACCESSIBILITY
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Accessible label for the menu
     */
    [PROPS.ARIA_LABEL]: {
      description: "Accessible label for the navigation",
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
  // DATA BINDINGS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Dynamic data binding:
   *   :items - Array of MenuItem objects
   *
   * MenuItem shape:
   *   {
   *     name: string (required),
   *     href?: string,
   *     active?: boolean,
   *     disabled?: boolean,
   *     icon?: string,
   *     children?: MenuItem[]
   *   }
   */
  bindings: {
    items: BINDINGS.MENU_ITEMS,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Supported events:
   *   @select - Item selected/clicked
   */
  events: [EVENTS.SELECT],

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  content: {
    allowed: true,
    description: "Menu items (alternative to :items binding)",
    allowedChildren: ["menu-item"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHILD COMPONENTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * <c-menu-item> - Individual menu item
   *
   * Can ONLY be used inside <c-menu>.
   * Can contain nested <c-menu-item> for submenus.
   */
  children: {
    "menu-item": {
      name: "menu-item",
      description: "Individual menu item (only valid inside <c-menu>)",

      props: {
        /**
         * Item label (required)
         */
        [PROPS.LABEL]: {
          required: true,
          description: "Menu item label text",
        },

        /**
         * Link URL (optional - makes item a link)
         */
        [PROPS.HREF]: {
          description: "Link URL",
        },

        /**
         * Link target
         */
        [PROPS.TARGET]: {
          values: VALUES.LINK_TARGETS,
          description: "Link target (only used when href is set)",
        },

        /**
         * Icon name
         */
        [PROPS.ICON]: {
          description: "Icon name (from implementation icon set)",
        },

        /**
         * Whether item is currently active/selected
         */
        [PROPS.ACTIVE]: null, // boolean

        /**
         * Whether the item expands a submenu (shows a disclosure chevron)
         */
        expandable: null, // boolean

        /**
         * Whether item is disabled
         */
        [PROPS.DISABLED]: null, // boolean

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

      /**
       * Content can contain nested menu-items for submenus
       */
      content: {
        allowed: true,
        description: "Nested menu items (for submenus)",
        allowedChildren: ["menu-item"],
      },
    },
  },
});

// Export type for the menu definition
export type MenuDefinition = typeof menu;
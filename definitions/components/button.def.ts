/**
 * Button Component Definition
 *
 * Interactive button for user actions.
 *
 * Usage:
 *   <c-button type="primary" name="Submit"/>
 *   <c-button type="secondary" @click="handleClick()">Click me</c-button>
 *   <c-button href="/path" type="tertiary">Link button</c-button>
 */

import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";
import { VALUES } from "../values.js";
import { EVENTS } from "../events.js";

export const button = defineComponent({
  name: "button",
  description: "Interactive button for user actions",
  category: "actions",

  props: {
    // ═══════════════════════════════════════════════════════════════════════
    // APPEARANCE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Visual style variant
     * @default "primary"
     */
    [PROPS.TYPE]: {
      values: VALUES.BUTTON_TYPES,
      default: "primary",
      description: "Visual style variant",
    },

    /**
     * Button size
     * @default "md"
     */
    [PROPS.SIZE]: {
      values: VALUES.SIZES,
      default: "md",
      description: "Button size",
    },

    /**
     * Icon to display
     * Value depends on implementation icon set
     */
    [PROPS.ICON]: {
      description: "Icon name (from implementation icon set)",
    },

    /**
     * Icon position relative to label
     * @default "no" (no icon shown)
     */
    [PROPS.SHOW_ICON]: {
      values: VALUES.ICON_POSITIONS,
      default: "no",
      description: "Icon position: before label, after label, or hidden",
    },

    /**
     * Icon color
     * @default "wit"
     */
    [PROPS.COLOR]: {
      default: "wit",
      description: "Icon color",
    },

    /**
     * Whether button takes full width of container
     */
    [PROPS.FULL_WIDTH]: null, // boolean

    // ═══════════════════════════════════════════════════════════════════════
    // CONTENT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Button label text
     * Can be overridden by content between tags
     */
    [PROPS.LABEL]: {
      description: "Button label text (can be overridden by content between tags)",
    },

    /**
     * Accessible label (for icon-only buttons)
     */
    [PROPS.ARIA_LABEL]: {
      description: "Accessible label (for icon-only buttons)",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Disabled state - prevents interaction
     */
    [PROPS.DISABLED]: null, // boolean

    /**
     * Loading/busy state - shows loading indicator
     */
    [PROPS.LOADING]: null, // boolean

    /**
     * Active/pressed state
     */
    [PROPS.ACTIVE]: null, // boolean

    // ═══════════════════════════════════════════════════════════════════════
    // BEHAVIOR
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * HTML button type attribute
     * @default "button"
     */
    [PROPS.HTML_TYPE]: {
      values: VALUES.BUTTON_HTML_TYPES,
      default: "button",
      description: "HTML type attribute (button, submit, reset)",
    },

    /**
     * If set, renders as <a> instead of <button>
     */
    [PROPS.HREF]: {
      description: "Link URL - if set, renders as <a> instead of <button>",
    },

    /**
     * Link target (only when href is set)
     */
    [PROPS.TARGET]: {
      values: VALUES.LINK_TARGETS,
      description: "Link target (only used when href is set)",
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
  // EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Supported events:
   *   @click - Button clicked
   *   @focus - Button received focus
   *   @blur  - Button lost focus
   */
  events: [EVENTS.CLICK, EVENTS.FOCUS, EVENTS.BLUR],

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  content: {
    allowed: true,
    description:
      "Button label content (overrides name prop). Can include HTML/components.",
  },
});

// Export type for the button definition
export type ButtonDefinition = typeof button;
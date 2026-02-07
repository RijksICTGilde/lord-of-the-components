/**
 * Alert Component Definition
 *
 * Status alert with icon, heading, content, and optional close button.
 *
 * Usage:
 *   <c-alert type="info" heading="Notice">Some info text</c-alert>
 *   <c-alert type="error" heading="Error occurred" closable/>
 */

import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";
import { VALUES } from "../values.js";

export const alert = defineComponent({
  name: "alert",
  description: "Status alert with icon, heading, and optional close button",
  category: "feedback",

  props: {
    /**
     * Alert type/kind (determines icon and color)
     * @default "info"
     */
    [PROPS.TYPE]: {
      values: VALUES.STATUS_TYPES,
      default: "info",
      description: "Alert type: info, success, warning, error",
    },

    /**
     * Alert heading (displayed as bold text)
     */
    [PROPS.HEADING]: {
      description: "Alert heading text (displayed as bold)",
    },

    /**
     * Padding size
     * @default "md"
     */
    [PROPS.PADDING]: {
      values: VALUES.ALERT_PADDING,
      default: "md",
      description: "Alert padding size",
    },

    /**
     * Max width constraint
     */
    [PROPS.MAX_WIDTH]: {
      values: VALUES.ALERT_MAX_WIDTHS,
      description: "Max width constraint (sm, md, lg)",
    },

    /**
     * Whether the alert can be closed
     */
    [PROPS.CLOSABLE]: null,

    /**
     * Additional CSS classes
     */
    [PROPS.CLASS]: {
      description: "Additional CSS classes",
    },
  },

  content: {
    allowed: true,
    description: "Alert content (can include HTML/components)",
  },
});

export type AlertDefinition = typeof alert;

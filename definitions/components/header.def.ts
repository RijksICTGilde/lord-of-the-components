/**
 * Header Component Definition
 *
 * Page header with Rijksoverheid logo, organization name, and optional subtitle.
 *
 * Usage:
 *   <c-header text="Rijksorganisatie"/>
 *   <c-header text="RVO" subtitle="Ministerie van EZK" link="/"/>
 *   <c-header text="My Org" subtitle="Department">
 *     Additional header content here
 *   </c-header>
 */

import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const header = defineComponent({
  name: "header",
  description: "Page header with government logo and organization name",
  category: "layout",

  props: {
    // ═══════════════════════════════════════════════════════════════════════
    // CONTENT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Organization name text displayed in the logo wordmark
     */
    text: {
      description: "Organization name text displayed in the logo wordmark",
    },

    /**
     * Subtitle/ministry text displayed below the organization name
     */
    [PROPS.SUBTITLE]: {
      description: "Subtitle or ministry text below the organization name",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // LINK
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * URL the logo links to
     * @default "#"
     */
    link: {
      default: "#",
      description: "URL the logo links to",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // STYLING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Additional CSS classes
     */
    [PROPS.CLASS]: {
      description: "Additional CSS classes",
    },
  },

  content: {
    allowed: true,
    description: "Additional header content (navigation, actions, etc.)",
  },
});

// Export type for the header definition
export type HeaderDefinition = typeof header;
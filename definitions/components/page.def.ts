/**
 * Page Component Definition
 *
 * Full HTML document wrapper that provides the <!DOCTYPE html> structure,
 * meta tags, asset loading, and body content.
 *
 * Unlike other components that render a single HTML element, the page component
 * renders an entire HTML document including <html>, <head>, and <body> tags.
 *
 * Usage:
 *   <c-page title="My Page">
 *     <c-heading type="h1" name="Welcome"/>
 *     <c-paragraph name="Page content here."/>
 *   </c-page>
 *
 *   <c-page title="About Us" description="About our company" lang="nl">
 *     Content here
 *   </c-page>
 */

import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const page = defineComponent({
  name: "page",
  description:
    "Full HTML document wrapper with head, meta tags, assets, and body content",
  category: "layout",

  props: {
    // ═══════════════════════════════════════════════════════════════════════
    // DOCUMENT METADATA
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Page title shown in browser tab
     */
    [PROPS.TITLE]: {
      required: true,
      description: "Page title shown in browser tab",
    },

    /**
     * HTML language attribute
     * @default "en"
     */
    lang: {
      default: "en",
      description: "HTML language attribute",
    },

    /**
     * Document character encoding
     * @default "utf-8"
     */
    charset: {
      default: "utf-8",
      description: "Document character encoding",
    },

    /**
     * Meta description for SEO
     */
    [PROPS.DESCRIPTION]: {
      description: "Meta description for SEO",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // THEMING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Theme name applied as body class (theme-{value})
     */
    [PROPS.THEME]: {
      description: "Theme name applied as body class",
    },

    /**
     * Design systems this page uses (space-separated, e.g. "nldd bgnldd"), so
     * their CSS/JS bundles are loaded. Emit via {{ get_design_system_assets() }}.
     */
    "design-systems": {
      description: "Design systems in use (space-separated); drives asset loading",
    },

    /**
     * Additional CSS classes for the body element
     */
    "body-class": {
      description: "Additional CSS classes for the body element",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ADDITIONAL HEAD CONTENT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Additional content injected into <head> (raw HTML)
     */
    head: {
      description: "Additional content for the <head> section (raw HTML)",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // STYLING ESCAPE HATCH
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Additional CSS classes (applied to body)
     */
    [PROPS.CLASS]: {
      description: "Additional CSS classes",
    },
  },

  content: {
    allowed: true,
    description: "Page body content. Can include any components and HTML.",
  },
});

// Export type for the page definition
export type PageDefinition = typeof page;

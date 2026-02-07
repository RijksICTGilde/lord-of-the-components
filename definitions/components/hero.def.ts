/**
 * Hero Component Definition
 *
 * Large hero/banner section with image, title, subtitle, and content.
 *
 * Usage:
 *   <c-hero title="Welcome" subtitle="To our site"/>
 *   <c-hero title="About" image="/hero.jpg" image-alt="Hero banner" size="lg"/>
 *   <c-hero title="Info" overlay>
 *     <c-paragraph name="More details here."/>
 *   </c-hero>
 */

import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";
import { VALUES } from "../values.js";

export const hero = defineComponent({
  name: "hero",
  description: "Large hero/banner section with image, title, and content",
  category: "layout",

  props: {
    // ═══════════════════════════════════════════════════════════════════════
    // CONTENT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Hero title (rendered as h1)
     */
    [PROPS.TITLE]: {
      description: "Hero title text (rendered as h1 heading)",
    },

    /**
     * Subtitle text below the title
     */
    [PROPS.SUBTITLE]: {
      description: "Subtitle text below the title",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // IMAGE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Background/hero image URL
     */
    [PROPS.IMAGE]: {
      description: "Hero image URL",
    },

    /**
     * Image alt text for accessibility
     */
    [PROPS.IMAGE_ALT]: {
      description: "Image alt text for accessibility",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // VISUAL
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Hero size variant
     * @default "md"
     */
    [PROPS.SIZE]: {
      values: VALUES.LAYOUT_SIZES,
      default: "md",
      description: "Hero size (sm, md, lg)",
    },

    /**
     * Whether to show content overlaying the image
     */
    overlay: null,

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
    description: "Additional content displayed in the hero section",
  },
});

export type HeroDefinition = typeof hero;

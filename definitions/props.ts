/**
 * PROPS - All allowed property names
 *
 * These are the semantic property names that can be used on components.
 * Using a centralized dictionary ensures consistency across all components.
 */

export const PROPS = {
  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTIFICATION
  // ═══════════════════════════════════════════════════════════════════════════
  ID: "id",
  NAME: "name",

  // ═══════════════════════════════════════════════════════════════════════════
  // SEMANTIC TYPE
  // ═══════════════════════════════════════════════════════════════════════════
  TYPE: "type",
  KIND: "kind",
  VARIANT: "variant",

  // ═══════════════════════════════════════════════════════════════════════════
  // VISUAL
  // ═══════════════════════════════════════════════════════════════════════════
  SIZE: "size",
  COLOR: "color",
  BACKGROUND_COLOR: "background-color",

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE (boolean props - presence = true, absence = false)
  // ═══════════════════════════════════════════════════════════════════════════
  DISABLED: "disabled",
  REQUIRED: "required",
  READONLY: "readonly",
  LOADING: "loading",
  BUSY: "busy",
  ACTIVE: "active",
  OPEN: "open",
  CHECKED: "checked",
  SELECTED: "selected",
  EXPANDED: "expanded",
  INVALID: "invalid",
  CLOSABLE: "closable",
  INVERTED_COLORS: "inverted-colors",

  // ═══════════════════════════════════════════════════════════════════════════
  // CARD-SPECIFIC
  // ═══════════════════════════════════════════════════════════════════════════
  FULL_CARD_LINK: "full-card-link",
  SHOW_LINK_INDICATOR: "show-link-indicator",

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTENT
  // ═══════════════════════════════════════════════════════════════════════════
  TITLE: "title",
  SUBTITLE: "subtitle",
  LABEL: "label",
  PLACEHOLDER: "placeholder",
  VALUE: "value",
  DEFAULT_VALUE: "default-value",
  DESCRIPTION: "description",
  HELPER_TEXT: "helper-text",
  ERROR_TEXT: "error-text",

  // ═══════════════════════════════════════════════════════════════════════════
  // LINKS & NAVIGATION
  // ═══════════════════════════════════════════════════════════════════════════
  HREF: "href",
  TARGET: "target",
  URL: "url",

  // ═══════════════════════════════════════════════════════════════════════════
  // ICONS
  // ═══════════════════════════════════════════════════════════════════════════
  ICON: "icon",
  ICON_POSITION: "icon-position",
  ICON_SIZE: "icon-size",
  SHOW_ICON: "show-icon",

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════
  DIRECTION: "direction",
  ALIGN: "align",
  JUSTIFY: "justify",
  GAP: "gap",
  PADDING: "padding",
  MARGIN: "margin",
  WIDTH: "width",
  HEIGHT: "height",
  MAX_WIDTH: "max-width",
  FULL_WIDTH: "full-width",
  COLUMNS: "columns",
  LAYOUT: "layout",
  ROW: "row",
  WRAP: "wrap",
  ALIGN_ITEMS: "align-items",
  ALIGN_CONTENT: "align-content",
  JUSTIFY_ITEMS: "justify-items",
  JUSTIFY_CONTENT: "justify-content",
  VERTICAL_SPACING: "vertical-spacing",
  INLINE_PADDING: "inline-padding",
  CENTERED: "centered",
  UNCENTERED: "uncentered",
  DIVISION: "division",

  // ═══════════════════════════════════════════════════════════════════════════
  // IMAGES
  // ═══════════════════════════════════════════════════════════════════════════
  IMAGE: "image",
  IMAGE_ALT: "image-alt",
  IMAGE_POSITION: "image-position",
  IMAGE_SIZE: "image-size",
  INLINE_IMAGE: "inline-image",
  BACKGROUND_IMAGE: "background-image",

  // ═══════════════════════════════════════════════════════════════════════════
  // FORM-SPECIFIC
  // ═══════════════════════════════════════════════════════════════════════════
  HTML_FOR: "for",
  HTML_TYPE: "html-type",
  AUTOCOMPLETE: "autocomplete",
  MIN: "min",
  MAX: "max",
  STEP: "step",
  PATTERN: "pattern",
  MINLENGTH: "minlength",
  MAXLENGTH: "maxlength",

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCESSIBILITY
  // ═══════════════════════════════════════════════════════════════════════════
  ARIA_LABEL: "aria-label",
  ARIA_DESCRIBEDBY: "aria-describedby",
  ROLE: "role",

  // ═══════════════════════════════════════════════════════════════════════════
  // THEME
  // ═══════════════════════════════════════════════════════════════════════════
  THEME: "theme",

  // ═══════════════════════════════════════════════════════════════════════════
  // STYLING ESCAPE HATCH
  // ═══════════════════════════════════════════════════════════════════════════
  CLASS: "class",
} as const;

// Type for prop names
export type PropName = (typeof PROPS)[keyof typeof PROPS];

// Type guard to check if a string is a valid prop name
export function isPropName(value: string): value is PropName {
  return Object.values(PROPS).includes(value as PropName);
}
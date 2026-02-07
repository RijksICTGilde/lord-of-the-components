/**
 * VALUES - All allowed values for properties
 *
 * These are the semantic value sets that can be used for component properties.
 * Using a centralized dictionary ensures consistency and enables validation.
 */

export const VALUES = {
  // ═══════════════════════════════════════════════════════════════════════════
  // BUTTON/ACTION TYPES
  // ═══════════════════════════════════════════════════════════════════════════
  BUTTON_TYPES: [
    "primary",
    "secondary",
    "tertiary",
    "quaternary",
    "warning",
    "subtle",
    "warning-subtle",
  ] as const,

  // ═══════════════════════════════════════════════════════════════════════════
  // MENU TYPES
  // ═══════════════════════════════════════════════════════════════════════════
  MENU_TYPES: ["horizontal", "vertical"] as const,

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS TYPES (for alerts, tags, feedback)
  // ═══════════════════════════════════════════════════════════════════════════
  STATUS_TYPES: ["info", "success", "warning", "error"] as const,

  // ═══════════════════════════════════════════════════════════════════════════
  // SIZE SCALES
  // ═══════════════════════════════════════════════════════════════════════════
  SIZES: ["xs", "sm", "md", "lg", "xl"] as const,

  SIZES_EXTENDED: [
    "2xs",
    "xs",
    "sm",
    "md",
    "lg",
    "xl",
    "2xl",
    "3xl",
    "4xl",
  ] as const,

  // ═══════════════════════════════════════════════════════════════════════════
  // GAP/SPACING
  // ═══════════════════════════════════════════════════════════════════════════
  GAP_SIZES: [
    "none",
    "3xs",
    "2xs",
    "xs",
    "sm",
    "md",
    "lg",
    "xl",
    "2xl",
    "3xl",
    "4xl",
    "5xl",
  ] as const,

  PADDING_SIZES: ["none", "xs", "sm", "md", "lg", "xl", "2xl"] as const,

  // ═══════════════════════════════════════════════════════════════════════════
  // DIRECTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  DIRECTIONS: ["horizontal", "vertical"] as const,

  // ═══════════════════════════════════════════════════════════════════════════
  // ALIGNMENT
  // ═══════════════════════════════════════════════════════════════════════════
  ALIGNMENTS: ["start", "center", "end", "stretch", "baseline"] as const,

  JUSTIFY: [
    "start",
    "center",
    "end",
    "space-between",
    "space-around",
    "space-evenly",
  ] as const,

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYOUT-FLOW SPECIFIC
  // ═══════════════════════════════════════════════════════════════════════════
  LAYOUT_GAP_SIZES: [
    "0",
    "3xs",
    "2xs",
    "xs",
    "sm",
    "md",
    "lg",
    "xl",
    "2xl",
    "3xl",
    "4xl",
    "5xl",
  ] as const,

  LAYOUT_SIZES: ["sm", "md", "lg"] as const,

  FLEX_ALIGN: ["start", "center", "end"] as const,

  FLEX_JUSTIFY: ["start", "center", "end", "space-between"] as const,

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════
  CARD_LAYOUTS: ["column", "row"] as const,

  MAX_WIDTHS: ["sm", "md", "lg", "xl", "2xl", "full"] as const,

  GRID_COLUMNS: [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
  ] as const,

  // ═══════════════════════════════════════════════════════════════════════════
  // ICON POSITIONS
  // ═══════════════════════════════════════════════════════════════════════════
  ICON_POSITIONS: ["before", "after", "no"] as const,

  // ═══════════════════════════════════════════════════════════════════════════
  // HTML BUTTON TYPES
  // ═══════════════════════════════════════════════════════════════════════════
  BUTTON_HTML_TYPES: ["button", "submit", "reset"] as const,

  // ═══════════════════════════════════════════════════════════════════════════
  // LINK TARGETS
  // ═══════════════════════════════════════════════════════════════════════════
  LINK_TARGETS: ["_self", "_blank", "_parent", "_top"] as const,

  // ═══════════════════════════════════════════════════════════════════════════
  // INPUT TYPES
  // ═══════════════════════════════════════════════════════════════════════════
  INPUT_TYPES: [
    "text",
    "password",
    "email",
    "tel",
    "url",
    "search",
    "number",
    "date",
    "time",
    "datetime-local",
    "file",
  ] as const,

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADING LEVELS
  // ═══════════════════════════════════════════════════════════════════════════
  HEADING_LEVELS: ["h1", "h2", "h3", "h4", "h5", "h6"] as const,

  // ═══════════════════════════════════════════════════════════════════════════
  // IMAGE POSITIONS
  // ═══════════════════════════════════════════════════════════════════════════
  IMAGE_POSITIONS: ["top", "bottom", "left", "right"] as const,

  IMAGE_SIZES: ["sm", "md"] as const,

  CARD_PADDING: ["none", "sm", "md", "lg", "xl"] as const,

  // ═══════════════════════════════════════════════════════════════════════════
  // PROGRESS STATES
  // ═══════════════════════════════════════════════════════════════════════════
  STEP_STATES: [
    "pending",
    "active",
    "completed",
    "disabled",
  ] as const,

  // ═══════════════════════════════════════════════════════════════════════════
  // BOOLEAN-LIKE (for strict string values)
  // ═══════════════════════════════════════════════════════════════════════════
  YES_NO: ["yes", "no"] as const,

  // ═══════════════════════════════════════════════════════════════════════════
  // THEMES (can be extended by implementation)
  // ═══════════════════════════════════════════════════════════════════════════
  THEMES: ["rvo", "default"] as const,
} as const;

// Helper type to extract the type of a value set
export type ValueOf<T extends readonly string[]> = T[number];

// Specific value types for commonly used value sets
export type ButtonType = ValueOf<typeof VALUES.BUTTON_TYPES>;
export type MenuType = ValueOf<typeof VALUES.MENU_TYPES>;
export type StatusType = ValueOf<typeof VALUES.STATUS_TYPES>;
export type Size = ValueOf<typeof VALUES.SIZES>;
export type Direction = ValueOf<typeof VALUES.DIRECTIONS>;
export type Alignment = ValueOf<typeof VALUES.ALIGNMENTS>;
export type IconPosition = ValueOf<typeof VALUES.ICON_POSITIONS>;
export type ButtonHtmlType = ValueOf<typeof VALUES.BUTTON_HTML_TYPES>;
export type LinkTarget = ValueOf<typeof VALUES.LINK_TARGETS>;
export type HeadingLevel = ValueOf<typeof VALUES.HEADING_LEVELS>;

// Type guard to check if a value is in a value set
export function isValueOf<T extends readonly string[]>(
  value: string,
  valueSet: T
): value is T[number] {
  return valueSet.includes(value as T[number]);
}
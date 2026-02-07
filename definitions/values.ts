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
  // ALERT
  // ═══════════════════════════════════════════════════════════════════════════
  ALERT_PADDING: ["xs", "sm", "md", "lg", "xl", "2xl"] as const,

  ALERT_MAX_WIDTHS: ["sm", "md", "lg"] as const,

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
  // LAYOUT-ROW VERTICAL SPACING
  // ═══════════════════════════════════════════════════════════════════════════
  VERTICAL_SPACING: [
    "xs",
    "sm",
    "md",
    "lg",
    "xl",
    "2xl",
    "3xl",
    "center",
  ] as const,

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYOUT-COLUMN SIZES (responsive breakpoint + column count)
  // ═══════════════════════════════════════════════════════════════════════════
  COLUMN_SIZES: [
    "xs-1", "xs-2", "xs-3", "xs-4", "xs-5", "xs-6",
    "xs-7", "xs-8", "xs-9", "xs-10", "xs-11", "xs-12",
    "sm-1", "sm-2", "sm-3", "sm-4", "sm-5", "sm-6",
    "sm-7", "sm-8", "sm-9", "sm-10", "sm-11", "sm-12",
    "md-1", "md-2", "md-3", "md-4", "md-5", "md-6",
    "md-7", "md-8", "md-9", "md-10", "md-11", "md-12",
    "lg-1", "lg-2", "lg-3", "lg-4", "lg-5", "lg-6",
    "lg-7", "lg-8", "lg-9", "lg-10", "lg-11", "lg-12",
  ] as const,

  // ═══════════════════════════════════════════════════════════════════════════
  // MAX-WIDTH-LAYOUT INLINE PADDING
  // ═══════════════════════════════════════════════════════════════════════════
  INLINE_PADDING: ["none", "sm", "md", "lg"] as const,

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

  GRID_COLUMN_NAMES: [
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
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
  // PARAGRAPH
  // ═══════════════════════════════════════════════════════════════════════════
  PARAGRAPH_COLORS: [
    "logoblauw",
    "wit",
    "zwart",
    "grijs-500",
    "grijs-900",
  ] as const,

  PARAGRAPH_SIZES: ["sm", "md", "lg"] as const,

  // ═══════════════════════════════════════════════════════════════════════════
  // LINK
  // ═══════════════════════════════════════════════════════════════════════════
  LINK_COLORS: [
    "hemelblauw",
    "donkerblauw",
    "lintblauw",
    "wit",
    "zwart",
    "grijs-700",
  ] as const,

  LINK_WEIGHTS: ["normal", "bold"] as const,

  // ═══════════════════════════════════════════════════════════════════════════
  // LABEL
  // ═══════════════════════════════════════════════════════════════════════════
  LABEL_SIZES: ["sm", "md"] as const,

  LABEL_TYPES: ["default", "optional", "required"] as const,

  // ═══════════════════════════════════════════════════════════════════════════
  // BREADCRUMBS
  // ═══════════════════════════════════════════════════════════════════════════
  BREADCRUMBS_SIZES: ["sm", "md", "lg"] as const,

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
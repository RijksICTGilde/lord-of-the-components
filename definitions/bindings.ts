/**
 * BINDINGS - Data structure shapes for dynamic bindings
 *
 * When using the : prefix (e.g., :items="data"), the bound data must
 * conform to a specific shape. These interfaces define what shapes
 * are allowed for each binding type.
 *
 * Example:
 *   <c-menu :items="menuData"/>
 *
 *   // menuData must be MenuItem[]
 *   const menuData: MenuItem[] = [
 *     { name: "Home", href: "/" },
 *     { name: "About", href: "/about", active: true },
 *   ];
 */

// ═══════════════════════════════════════════════════════════════════════════════
// MENU ITEMS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MenuItem - Shape for menu/navigation items
 *
 * Used by: <c-menu :items="..."/>
 */
export interface MenuItem {
  /** Display text (required) */
  label: string;

  /** Link URL (optional - if omitted, renders as non-link) */
  href?: string;

  /** Whether this item is currently active/selected */
  active?: boolean;

  /** Whether this item is disabled */
  disabled?: boolean;

  /** Icon name (from implementation icon set) */
  icon?: string;

  /** Nested items (for submenus) */
  children?: MenuItem[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// SELECT/DROPDOWN OPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SelectOption - Shape for select/dropdown options
 *
 * Used by: <c-select :options="..."/>
 */
export interface SelectOption {
  /** Display text (required) */
  label: string;

  /** Value when selected (required) */
  value: string | number;

  /** Whether this option is disabled */
  disabled?: boolean;

  /** Optional grouping label */
  group?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS/STEPPER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ProgressStep - Shape for progress tracker/stepper steps
 *
 * Used by: <c-progress-tracker :steps="..."/>
 */
export interface ProgressStep {
  /** Step label (required) */
  label: string;

  /** Step state */
  state?: "pending" | "active" | "completed" | "disabled";

  /** Optional link URL (makes step clickable) */
  href?: string;

  /** Optional description/subtitle */
  description?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BREADCRUMB ITEMS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * BreadcrumbItem - Shape for breadcrumb navigation
 *
 * Used by: <c-breadcrumb :items="..."/>
 */
export interface BreadcrumbItem {
  /** Display text (required) */
  label: string;

  /** Link URL (optional - last item typically has no href) */
  href?: string;

  /** Icon name */
  icon?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TABLE DATA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * TableColumn - Shape for table column definitions
 *
 * Used by: <c-table :columns="..."/>
 */
export interface TableColumn {
  /** Column key (maps to row data) */
  key: string;

  /** Column header label */
  label: string;

  /** Whether column is sortable */
  sortable?: boolean;

  /** Column width (CSS value) */
  width?: string;

  /** Text alignment */
  align?: "left" | "center" | "right";
}

/**
 * TableRow - Shape for table row data
 *
 * Used by: <c-table :rows="..."/>
 * Keys should match column keys
 */
export type TableRow = Record<string, unknown>;

// ═══════════════════════════════════════════════════════════════════════════════
// TAB ITEMS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * TabItem - Shape for tab navigation
 *
 * Used by: <c-tabs :items="..."/>
 */
export interface TabItem {
  /** Tab identifier (required) */
  id: string;

  /** Tab label (required) */
  label: string;

  /** Icon name */
  icon?: string;

  /** Whether tab is disabled */
  disabled?: boolean;

  /** Badge/count to display */
  badge?: string | number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BINDING TYPE REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * BINDINGS - Registry of binding type names
 *
 * Used in component definitions to specify which binding shape is expected:
 *
 * bindings: {
 *   items: BINDINGS.MENU_ITEMS,  // :items expects MenuItem[]
 * }
 */
export const BINDINGS = {
  MENU_ITEMS: "MenuItem[]",
  SELECT_OPTIONS: "SelectOption[]",
  PROGRESS_STEPS: "ProgressStep[]",
  BREADCRUMB_ITEMS: "BreadcrumbItem[]",
  TABLE_COLUMNS: "TableColumn[]",
  TABLE_ROWS: "TableRow[]",
  TAB_ITEMS: "TabItem[]",
} as const;

export type BindingType = (typeof BINDINGS)[keyof typeof BINDINGS];

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Maps binding type names to their TypeScript types
 */
export interface BindingTypeMap {
  "MenuItem[]": MenuItem[];
  "SelectOption[]": SelectOption[];
  "ProgressStep[]": ProgressStep[];
  "BreadcrumbItem[]": BreadcrumbItem[];
  "TableColumn[]": TableColumn[];
  "TableRow[]": TableRow[];
  "TabItem[]": TabItem[];
}
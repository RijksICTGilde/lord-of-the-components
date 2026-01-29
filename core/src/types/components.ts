/**
 * Lord of the Components - Component Type Definitions
 *
 * Types for component definitions, props, slots, and examples.
 */

// =============================================================================
// PROP TYPES
// =============================================================================

/**
 * Base prop type enumeration
 */
export type PropType =
  | 'string'
  | 'boolean'
  | 'number'
  | 'enum'
  | 'object'
  | 'array'
  | 'generic-size'    // sm, md, lg, xl
  | 'generic-color';  // primary, secondary, success, warning, error, info

/**
 * Enum value definition
 */
export interface EnumValue {
  value: string;
  description?: string;
}

/**
 * Component prop definition
 */
export interface PropDefinition {
  name: string;
  type: PropType;
  required: boolean;
  default?: string | number | boolean | null;
  description?: string;
  enumValues?: string[];  // For enum types
}

// =============================================================================
// SLOT TYPES
// =============================================================================

/**
 * Component slot definition
 */
export interface SlotDefinition {
  name: string;
  required: boolean;
  description?: string;
}

// =============================================================================
// TOKEN MAPPINGS
// =============================================================================

/**
 * Component token mapping
 * Maps component-specific token names to semantic token references
 */
export interface ComponentTokens {
  [tokenName: string]: string; // e.g., "primary.background": "{color.primary}"
}

// =============================================================================
// EXAMPLES
// =============================================================================

/**
 * Component example definition
 */
export interface ComponentExample {
  name: string;
  title: string;
  description?: string;
  code: string;
}

// =============================================================================
// ACCESSIBILITY
// =============================================================================

/**
 * Accessibility requirement
 */
export interface A11yRequirement {
  rule: string;
  description: string;
  wcag?: string; // WCAG reference (e.g., "2.1.1")
}

// =============================================================================
// COMPONENT DEFINITION
// =============================================================================

/**
 * Component status
 */
export type ComponentStatus = 'experimental' | 'beta' | 'stable' | 'deprecated';

/**
 * Component category
 */
export type ComponentCategory =
  | 'actions'      // Buttons, links
  | 'inputs'       // Form inputs
  | 'layout'       // Layout components
  | 'navigation'   // Navigation components
  | 'feedback'     // Alerts, toasts, progress
  | 'data-display' // Tables, lists, cards
  | 'overlay'      // Modals, drawers, tooltips
  | 'typography'   // Headings, text
  | 'media'        // Images, video, icons
  | 'utility';     // Utility components

/**
 * Full component definition
 */
export interface ComponentDefinition {
  name: string;
  description: string;
  category: ComponentCategory;
  status: ComponentStatus;
  dependsOn?: string[];  // Component dependencies

  props: PropDefinition[];
  slots: SlotDefinition[];
  tokens: ComponentTokens;
  examples: ComponentExample[];
  a11y?: A11yRequirement[];

  filePath: string;
}

// =============================================================================
// COMPONENT PACKAGE
// =============================================================================

/**
 * Package definition
 */
export interface PackageDefinition {
  name: string;
  version: string;
  description?: string;
  components: string[];  // Component names in this package
  dependencies?: string[];  // Other packages this depends on
  filePath: string;
}

// =============================================================================
// GENERIC VALUE ADAPTERS
// =============================================================================

/**
 * Generic size values
 */
export type GenericSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

/**
 * Generic color values
 */
export type GenericColor =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral';

/**
 * Adapter mapping for generic values
 */
export interface GenericValueAdapter {
  type: 'generic-size' | 'generic-color';
  mappings: {
    [genericValue: string]: string; // Maps generic value to implementation value
  };
}

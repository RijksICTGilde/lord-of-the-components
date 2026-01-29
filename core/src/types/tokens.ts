/**
 * Lord of the Components - Token Type Definitions
 *
 * Types for the 3-layer token system:
 * 1. Primitives - Raw values (colors, spacing, etc.)
 * 2. Semantic - Purpose-driven schema
 * 3. Implementation - Theme-specific mappings
 */

// =============================================================================
// PRIMITIVE TOKENS (Layer 1)
// =============================================================================

/**
 * A primitive token value with optional metadata
 */
export interface PrimitiveValue {
  value: string | number;
  type?: 'color' | 'dimension' | 'duration' | 'font-family' | 'font-weight' | 'number' | 'string';
  description?: string;
}

/**
 * Primitive token collection (e.g., colors.blue.500)
 */
export interface PrimitiveTokens {
  [category: string]: {
    [name: string]: PrimitiveValue | { [shade: string]: PrimitiveValue };
  };
}

// =============================================================================
// SEMANTIC TOKENS (Layer 2)
// =============================================================================

/**
 * Semantic token schema - defines the vocabulary of design tokens
 */
export interface SemanticSchema {
  [category: string]: string[]; // e.g., color: ['primary', 'primary-hover', 'on-primary']
}

/**
 * A semantic token reference (points to a primitive or another semantic token)
 */
export interface SemanticToken {
  name: string;
  category: string;
  description?: string;
}

// =============================================================================
// IMPLEMENTATION TOKENS (Layer 3 - Theme)
// =============================================================================

/**
 * Token reference - can be a direct value or a reference to another token
 * Format: "{primitives.colors.blue.500}" or "16px"
 */
export type TokenReference = string;

/**
 * Implementation token mapping - maps semantic tokens to values
 */
export interface ImplementationTokens {
  [category: string]: {
    [name: string]: TokenReference;
  };
}

// =============================================================================
// RESOLVED TOKENS
// =============================================================================

/**
 * A fully resolved token with its final value
 */
export interface ResolvedToken {
  name: string;
  category: string;
  value: string | number;
  cssProperty?: string; // CSS custom property name (e.g., --color-primary)
  source: 'primitive' | 'semantic' | 'implementation';
}

/**
 * Collection of all resolved tokens
 */
export interface ResolvedTokens {
  [cssProperty: string]: ResolvedToken;
}

// =============================================================================
// TOKEN FILES
// =============================================================================

/**
 * Parsed primitive tokens file
 */
export interface PrimitiveTokensFile {
  type: 'primitives';
  tokens: PrimitiveTokens;
  filePath: string;
}

/**
 * Parsed semantic schema file
 */
export interface SemanticSchemaFile {
  type: 'semantic';
  schema: SemanticSchema;
  filePath: string;
}

/**
 * Parsed implementation tokens file (theme)
 */
export interface ImplementationTokensFile {
  type: 'implementation';
  name: string;
  tokens: ImplementationTokens;
  filePath: string;
}

/**
 * Any token file type
 */
export type TokenFile = PrimitiveTokensFile | SemanticSchemaFile | ImplementationTokensFile;

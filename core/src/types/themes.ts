/**
 * Lord of the Components - Theme Type Definitions
 *
 * Types for themes and connectors that bind components to implementations.
 */

import type { ImplementationTokens } from './tokens.js';
import type { GenericValueAdapter } from './components.js';

// =============================================================================
// CONNECTOR TYPES
// =============================================================================

/**
 * Supported output frameworks
 */
export type ConnectorFramework = 'jinja2' | 'react' | 'vue' | 'html' | 'web-components';

/**
 * Component template mapping in a connector
 */
export interface ComponentTemplate {
  component: string;
  template: string;  // Path to template file relative to connector
}

/**
 * Connector definition - binds a theme to a specific framework
 */
export interface ConnectorDefinition {
  name: string;
  framework: ConnectorFramework;
  templatesPath: string;
  components: ComponentTemplate[];
  adapters?: GenericValueAdapter[];
  filePath: string;
}

// =============================================================================
// THEME TYPES
// =============================================================================

/**
 * Theme definition
 */
export interface ThemeDefinition {
  name: string;
  description?: string;
  extends?: string;  // Parent theme to extend
  tokens: ImplementationTokens;
  connectors: ConnectorDefinition[];
  filePath: string;
}

/**
 * Resolved theme with all token values computed
 */
export interface ResolvedTheme {
  name: string;
  tokens: {
    [cssProperty: string]: string | number;
  };
  connectors: {
    [framework: string]: ConnectorDefinition;
  };
}

// =============================================================================
// THEME CONTEXT
// =============================================================================

/**
 * Context passed to templates during rendering
 */
export interface ThemeContext {
  theme: string;
  tokens: {
    [cssProperty: string]: string | number;
  };
  adapters: {
    size: (value: string) => string;
    color: (value: string) => string;
  };
}

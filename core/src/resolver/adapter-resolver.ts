/**
 * Lord of the Components - Generic Value Adapter Resolver
 *
 * Resolves generic values (size, color) to implementation-specific values
 * using theme connector adapters.
 */

import type { GenericValueAdapter } from '../types/components.js';

// =============================================================================
// TYPES
// =============================================================================

export type GenericType = 'generic-size' | 'generic-color';

export interface AdapterCollection {
  'generic-size'?: GenericValueAdapter;
  'generic-color'?: GenericValueAdapter;
}

// =============================================================================
// DEFAULT ADAPTERS
// =============================================================================

/**
 * Default size adapter - passes through values as CSS classes
 */
export const DEFAULT_SIZE_ADAPTER: GenericValueAdapter = {
  type: 'generic-size',
  mappings: {
    'xs': 'size-xs',
    'sm': 'size-sm',
    'md': 'size-md',
    'lg': 'size-lg',
    'xl': 'size-xl',
    '2xl': 'size-2xl',
    '3xl': 'size-3xl',
  },
};

/**
 * Default color adapter - passes through values as CSS classes
 */
export const DEFAULT_COLOR_ADAPTER: GenericValueAdapter = {
  type: 'generic-color',
  mappings: {
    'primary': 'color-primary',
    'secondary': 'color-secondary',
    'success': 'color-success',
    'warning': 'color-warning',
    'error': 'color-error',
    'info': 'color-info',
    'neutral': 'color-neutral',
  },
};

// =============================================================================
// RESOLVER
// =============================================================================

export class AdapterResolver {
  private adapters: AdapterCollection;

  constructor(adapters: GenericValueAdapter[] = []) {
    this.adapters = {};

    // Load provided adapters
    for (const adapter of adapters) {
      this.adapters[adapter.type] = adapter;
    }

    // Fill in defaults
    if (!this.adapters['generic-size']) {
      this.adapters['generic-size'] = DEFAULT_SIZE_ADAPTER;
    }
    if (!this.adapters['generic-color']) {
      this.adapters['generic-color'] = DEFAULT_COLOR_ADAPTER;
    }
  }

  /**
   * Resolve a generic value to its implementation-specific value
   */
  resolve(type: GenericType, value: string): string {
    const adapter = this.adapters[type];
    if (!adapter) {
      return value; // Pass through if no adapter
    }

    const mapped = adapter.mappings[value];
    if (mapped === undefined) {
      console.warn(`No mapping found for ${type} value "${value}"`);
      return value; // Pass through if no mapping
    }

    return mapped;
  }

  /**
   * Resolve size value
   */
  resolveSize(value: string): string {
    return this.resolve('generic-size', value);
  }

  /**
   * Resolve color value
   */
  resolveColor(value: string): string {
    return this.resolve('generic-color', value);
  }

  /**
   * Check if a value is valid for a generic type
   */
  isValidValue(type: GenericType, value: string): boolean {
    const adapter = this.adapters[type];
    if (!adapter) {
      return true; // No adapter means any value is valid
    }
    return value in adapter.mappings;
  }

  /**
   * Get all valid values for a generic type
   */
  getValidValues(type: GenericType): string[] {
    const adapter = this.adapters[type];
    if (!adapter) {
      return [];
    }
    return Object.keys(adapter.mappings);
  }

  /**
   * Validate that all adapters have complete mappings
   */
  validate(): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check size adapter
    const sizeAdapter = this.adapters['generic-size'];
    if (sizeAdapter) {
      const expectedSizes = ['xs', 'sm', 'md', 'lg', 'xl'];
      for (const size of expectedSizes) {
        if (!(size in sizeAdapter.mappings)) {
          warnings.push(`Size adapter missing mapping for "${size}"`);
        }
      }
    }

    // Check color adapter
    const colorAdapter = this.adapters['generic-color'];
    if (colorAdapter) {
      const expectedColors = ['primary', 'secondary', 'success', 'warning', 'error', 'info'];
      for (const color of expectedColors) {
        if (!(color in colorAdapter.mappings)) {
          warnings.push(`Color adapter missing mapping for "${color}"`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Create Jinja2 helper functions for use in templates
   */
  toJinja2Helpers(): string {
    const sizeAdapter = this.adapters['generic-size'];
    const colorAdapter = this.adapters['generic-color'];

    const sizeMap = sizeAdapter
      ? JSON.stringify(sizeAdapter.mappings)
      : '{}';
    const colorMap = colorAdapter
      ? JSON.stringify(colorAdapter.mappings)
      : '{}';

    return `
{# Generic value adapter helpers #}
{% set _size_map = ${sizeMap} %}
{% set _color_map = ${colorMap} %}

{% macro resolve_size(value) %}{{ _size_map.get(value, value) }}{% endmacro %}
{% macro resolve_color(value) %}{{ _color_map.get(value, value) }}{% endmacro %}
`.trim();
  }
}

/**
 * Resolve a generic value using provided adapters
 */
export function resolveGenericValue(
  type: GenericType,
  value: string,
  adapters: GenericValueAdapter[] = []
): string {
  const resolver = new AdapterResolver(adapters);
  return resolver.resolve(type, value);
}

/**
 * Create an adapter resolver from connector definition
 */
export function createAdapterResolver(
  connectorAdapters?: GenericValueAdapter[]
): AdapterResolver {
  return new AdapterResolver(connectorAdapters ?? []);
}

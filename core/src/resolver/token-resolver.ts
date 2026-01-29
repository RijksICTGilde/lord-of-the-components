/**
 * Lord of the Components - Token Resolver
 *
 * Resolves token references to their final values.
 */

import type {
  PrimitiveTokens,
  ImplementationTokens,
  ResolvedToken,
  ResolvedTokens,
  PrimitiveValue,
} from '../types/tokens.js';

export class TokenResolver {
  private primitives: PrimitiveTokens;
  private maxDepth = 10; // Maximum reference resolution depth

  constructor(primitives: PrimitiveTokens) {
    this.primitives = primitives;
  }

  /**
   * Resolve a single token reference to its value
   *
   * References use the format: "{primitives.colors.blue.500}"
   * Direct values are returned as-is: "16px"
   */
  resolve(reference: string): string | number {
    // Check if it's a reference
    const match = reference.match(/^\{(.+)\}$/);
    if (!match) {
      // Direct value
      return reference;
    }

    const path = match[1];
    return this.resolveReference(path, 0);
  }

  /**
   * Resolve a reference path to its value
   */
  private resolveReference(path: string, depth: number): string | number {
    if (depth > this.maxDepth) {
      throw new Error(`Circular or too deep token reference: ${path}`);
    }

    const parts = path.split('.');
    let current: any = this.primitives;

    // Handle "primitives." prefix
    if (parts[0] === 'primitives') {
      parts.shift();
    }

    for (const part of parts) {
      if (current === undefined || current === null) {
        throw new Error(`Token not found: ${path}`);
      }
      current = current[part];
    }

    if (current === undefined || current === null) {
      throw new Error(`Token not found: ${path}`);
    }

    // Check if we got a PrimitiveValue
    if (typeof current === 'object' && 'value' in current) {
      const value = (current as PrimitiveValue).value;

      // Check if the value is itself a reference
      if (typeof value === 'string' && value.startsWith('{')) {
        const innerMatch = value.match(/^\{(.+)\}$/);
        if (innerMatch) {
          return this.resolveReference(innerMatch[1], depth + 1);
        }
      }

      return value;
    }

    // Handle direct value
    if (typeof current === 'string' || typeof current === 'number') {
      // Check if it's a reference
      if (typeof current === 'string' && current.startsWith('{')) {
        const innerMatch = current.match(/^\{(.+)\}$/);
        if (innerMatch) {
          return this.resolveReference(innerMatch[1], depth + 1);
        }
      }
      return current;
    }

    throw new Error(`Invalid token value at path: ${path}`);
  }

  /**
   * Resolve all implementation tokens to final values
   */
  resolveAll(implementationTokens: ImplementationTokens): ResolvedTokens {
    const resolved: ResolvedTokens = {};

    for (const [category, tokens] of Object.entries(implementationTokens)) {
      for (const [name, reference] of Object.entries(tokens)) {
        const cssProperty = `--${category}-${name}`;
        const value = this.resolve(reference);

        resolved[cssProperty] = {
          name,
          category,
          value,
          cssProperty,
          source: 'implementation',
        };
      }
    }

    return resolved;
  }

  /**
   * Generate CSS custom properties from resolved tokens
   */
  toCss(resolved: ResolvedTokens, selector: string = ':root'): string {
    const properties = Object.entries(resolved)
      .map(([prop, token]) => `  ${prop}: ${token.value};`)
      .sort()
      .join('\n');

    return `${selector} {\n${properties}\n}`;
  }

  /**
   * Generate JSON from resolved tokens
   */
  toJson(resolved: ResolvedTokens): string {
    const tokens: Record<string, string | number> = {};

    for (const [prop, token] of Object.entries(resolved)) {
      tokens[prop] = token.value;
    }

    return JSON.stringify(tokens, null, 2);
  }

  /**
   * Generate a flat token map (category.name -> value)
   */
  toFlatMap(resolved: ResolvedTokens): Record<string, string | number> {
    const result: Record<string, string | number> = {};

    for (const token of Object.values(resolved)) {
      result[`${token.category}.${token.name}`] = token.value;
    }

    return result;
  }
}

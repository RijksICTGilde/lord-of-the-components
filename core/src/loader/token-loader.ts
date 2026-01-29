/**
 * Lord of the Components - Token Loader
 *
 * Loads and manages design tokens from the file system.
 */

import { readdir } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import { parseKdlFile, parsePrimitiveTokensKdl, parseSemanticSchemaKdl } from '../parser/kdl-parser.js';
import type { PrimitiveTokens, SemanticSchema, PrimitiveValue } from '../types/tokens.js';

export class TokenLoader {
  private projectRoot: string;
  private primitives: PrimitiveTokens = {};
  private semanticSchema: SemanticSchema = {};

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Load all tokens from the project
   */
  async loadAll(): Promise<void> {
    await this.loadPrimitives();
    await this.loadSemanticSchema();
  }

  /**
   * Load primitive tokens from tokens/primitives/
   */
  async loadPrimitives(): Promise<void> {
    const primitivesDir = resolve(this.projectRoot, 'tokens/primitives');

    try {
      const files = await readdir(primitivesDir);
      const kdlFiles = files.filter((f) => extname(f) === '.kdl');

      for (const file of kdlFiles) {
        const filePath = join(primitivesDir, file);
        const kdl = await parseKdlFile(filePath);
        const tokens = parsePrimitiveTokensKdl(kdl);

        // Merge with existing primitives
        for (const [category, values] of Object.entries(tokens)) {
          if (!this.primitives[category]) {
            this.primitives[category] = {};
          }
          Object.assign(this.primitives[category], values);
        }
      }
    } catch (error) {
      // Directory might not exist yet
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Load semantic schema from tokens/semantic/
   */
  async loadSemanticSchema(): Promise<void> {
    const semanticDir = resolve(this.projectRoot, 'tokens/semantic');

    try {
      const files = await readdir(semanticDir);
      const kdlFiles = files.filter((f) => extname(f) === '.kdl');

      for (const file of kdlFiles) {
        const filePath = join(semanticDir, file);
        const kdl = await parseKdlFile(filePath);
        const schema = parseSemanticSchemaKdl(kdl);

        // Merge with existing schema
        for (const [category, tokens] of Object.entries(schema)) {
          if (!this.semanticSchema[category]) {
            this.semanticSchema[category] = [];
          }
          this.semanticSchema[category].push(...tokens);
        }
      }
    } catch (error) {
      // Directory might not exist yet
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Get all loaded primitives
   */
  getPrimitives(): PrimitiveTokens {
    return this.primitives;
  }

  /**
   * Get the semantic schema
   */
  getSemanticSchema(): SemanticSchema {
    return this.semanticSchema;
  }

  /**
   * Get a specific primitive value by path (e.g., "colors.blue.500")
   */
  getPrimitive(path: string): PrimitiveValue | undefined {
    const parts = path.split('.');
    let current: any = this.primitives;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[part];
    }

    // Check if we got a PrimitiveValue
    if (current && typeof current === 'object' && 'value' in current) {
      return current as PrimitiveValue;
    }

    return undefined;
  }

  /**
   * Get all token paths for a category
   */
  getTokenPaths(category: string): string[] {
    const paths: string[] = [];
    const categoryData = this.primitives[category];

    if (!categoryData) return paths;

    const collectPaths = (obj: any, prefix: string) => {
      for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && 'value' in value) {
          paths.push(path);
        } else if (value && typeof value === 'object') {
          collectPaths(value, path);
        }
      }
    };

    collectPaths(categoryData, category);
    return paths;
  }

  /**
   * Validate that all semantic tokens have implementations in a theme
   */
  validateAgainstSchema(implementationTokens: Record<string, Record<string, string>>): string[] {
    const errors: string[] = [];

    for (const [category, tokens] of Object.entries(this.semanticSchema)) {
      const implCategory = implementationTokens[category];
      if (!implCategory) {
        errors.push(`Missing implementation for category: ${category}`);
        continue;
      }

      for (const token of tokens) {
        if (!(token in implCategory)) {
          errors.push(`Missing implementation for semantic token: ${category}.${token}`);
        }
      }
    }

    return errors;
  }
}

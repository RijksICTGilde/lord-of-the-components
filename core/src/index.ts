/**
 * Lord of the Components - Core Module
 *
 * Main exports for the LOTC build tooling.
 */

// Types
export * from './types/tokens.js';
export * from './types/components.js';
export * from './types/themes.js';

// Parser
export { parseKdl, parseKdlFile } from './parser/kdl-parser.js';

// Loaders
export { TokenLoader } from './loader/token-loader.js';
export { ComponentLoader } from './loader/component-loader.js';
export { ThemeLoader } from './loader/theme-loader.js';

// Resolvers
export { TokenResolver } from './resolver/token-resolver.js';
export { AdapterResolver, resolveGenericValue, createAdapterResolver } from './resolver/adapter-resolver.js';

// RigScript
export * from './rigscript/index.js';

// Validators
export {
  AccessibilityValidator,
  validateAccessibility,
  validateAllAccessibility,
} from './validators/accessibility.js';
export type { AccessibilityIssue, ValidationResult } from './validators/accessibility.js';

// Generators
export { DocsGenerator, generateDocs } from './generators/docs/index.js';
export { RegistryGenerator, generateRegistry } from './generators/registry/index.js';
export { WebTypesGenerator, generateWebTypes } from './generators/ide/web-types.js';
export { VSCodeCustomDataGenerator, generateVSCodeCustomData } from './generators/ide/vscode-custom-data.js';

// Build
export { build, BuildOptions } from './build.js';

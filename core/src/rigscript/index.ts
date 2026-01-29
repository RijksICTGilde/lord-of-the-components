/**
 * Lord of the Components - RigScript Module
 *
 * RigScript is a Python-like DSL for component rendering logic.
 * This module provides lexer, parser, and transpilers.
 */

// Types
export * from './types.js';

// Lexer
export { Lexer, tokenize } from './lexer.js';

// Parser
export { Parser, parse } from './parser.js';

// Transpilers
export { Jinja2Transpiler, transpileToJinja2 } from './transpiler-jinja2.js';
export { ReactTranspiler, compileToReact } from './transpiler-react.js';
export type { TranspilerOptions as ReactTranspilerOptions } from './transpiler-react.js';

// Builtins
export {
  isBuiltin,
  getBuiltin,
  transformToJinja2 as transformBuiltinToJinja2,
  transformToReact as transformBuiltinToReact,
  BUILTINS,
  JINJA2_BUILTINS,
  REACT_BUILTINS,
} from './builtins.js';
export type { BuiltinFunction, Jinja2BuiltinMapping, ReactBuiltinMapping } from './builtins.js';

// Convenience functions to compile RigScript
import { tokenize } from './lexer.js';
import { parse } from './parser.js';
import { transpileToJinja2, type TranspilerOptions } from './transpiler-jinja2.js';
import { compileToReact as _compileToReact, type TranspilerOptions as ReactOptions } from './transpiler-react.js';

/**
 * Compile RigScript source to Jinja2 template
 */
export function compileToJinja2(source: string, options?: TranspilerOptions): string {
  const tokens = tokenize(source);
  const ast = parse(tokens);
  return transpileToJinja2(ast, options);
}

/**
 * Compile RigScript source to React component
 */
export function compileRigScriptToReact(source: string, options?: ReactOptions): string {
  const tokens = tokenize(source);
  const ast = parse(tokens);
  return _compileToReact(ast, options);
}

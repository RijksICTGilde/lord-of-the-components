/**
 * Lord of the Components - RigScript Builtins
 *
 * Defines built-in functions available in RigScript and their
 * mappings to target template languages.
 */

// =============================================================================
// BUILTIN FUNCTION DEFINITIONS
// =============================================================================

export interface BuiltinFunction {
  /** Name of the function in RigScript */
  name: string;
  /** Minimum number of arguments */
  minArgs: number;
  /** Maximum number of arguments */
  maxArgs: number;
  /** Description of the function */
  description: string;
}

/**
 * Registry of all built-in functions
 */
export const BUILTINS: Record<string, BuiltinFunction> = {
  join: {
    name: 'join',
    minArgs: 2,
    maxArgs: 2,
    description: 'Join array elements with a separator',
  },
  default: {
    name: 'default',
    minArgs: 2,
    maxArgs: 2,
    description: 'Return fallback value if first argument is undefined/null',
  },
};

/**
 * Check if a function name is a builtin
 */
export function isBuiltin(name: string): boolean {
  return name in BUILTINS;
}

/**
 * Get builtin function definition
 */
export function getBuiltin(name: string): BuiltinFunction | undefined {
  return BUILTINS[name];
}

// =============================================================================
// JINJA2 MAPPINGS
// =============================================================================

export interface Jinja2BuiltinMapping {
  /**
   * Transform the function call to Jinja2 syntax
   * @param args - The transpiled argument strings
   * @returns The Jinja2 expression string
   */
  transform: (args: string[]) => string;
}

/**
 * Jinja2 mappings for builtin functions
 */
export const JINJA2_BUILTINS: Record<string, Jinja2BuiltinMapping> = {
  /**
   * join(array, separator) -> array | join(separator)
   *
   * Example:
   *   Input:  join(classes, " ")
   *   Output: classes | join(" ")
   */
  join: {
    transform: (args: string[]) => {
      const [array, separator] = args;
      return `${array} | join(${separator})`;
    },
  },

  /**
   * default(value, fallback) -> value | default(fallback)
   *
   * Example:
   *   Input:  default(props.variant, "primary")
   *   Output: ctx.variant | default("primary")
   */
  default: {
    transform: (args: string[]) => {
      const [value, fallback] = args;
      return `${value} | default(${fallback})`;
    },
  },
};

/**
 * Transform a builtin function call to Jinja2 syntax
 * @param name - The function name
 * @param args - The transpiled argument strings
 * @returns The Jinja2 expression string, or null if not a builtin
 */
export function transformToJinja2(name: string, args: string[]): string | null {
  const mapping = JINJA2_BUILTINS[name];
  if (!mapping) {
    return null;
  }
  return mapping.transform(args);
}

// =============================================================================
// REACT MAPPINGS
// =============================================================================

export interface ReactBuiltinMapping {
  /**
   * Transform the function call to React/JSX syntax
   * @param args - The transpiled argument strings
   * @returns The React expression string
   */
  transform: (args: string[]) => string;
}

/**
 * React mappings for builtin functions
 */
export const REACT_BUILTINS: Record<string, ReactBuiltinMapping> = {
  /**
   * join(array, separator) -> array.join(separator)
   *
   * Example:
   *   Input:  join(classes, " ")
   *   Output: classes.join(" ")
   */
  join: {
    transform: (args: string[]) => {
      const [array, separator] = args;
      return `${array}.join(${separator})`;
    },
  },

  /**
   * default(value, fallback) -> value ?? fallback
   *
   * Example:
   *   Input:  default(props.variant, "primary")
   *   Output: props.variant ?? "primary"
   */
  default: {
    transform: (args: string[]) => {
      const [value, fallback] = args;
      return `(${value} ?? ${fallback})`;
    },
  },
};

/**
 * Transform a builtin function call to React syntax
 * @param name - The function name
 * @param args - The transpiled argument strings
 * @returns The React expression string, or null if not a builtin
 */
export function transformToReact(name: string, args: string[]): string | null {
  const mapping = REACT_BUILTINS[name];
  if (!mapping) {
    return null;
  }
  return mapping.transform(args);
}

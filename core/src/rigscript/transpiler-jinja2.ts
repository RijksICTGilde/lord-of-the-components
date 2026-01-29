/**
 * Lord of the Components - RigScript to Jinja2 Transpiler
 *
 * Converts RigScript AST to Jinja2 template code.
 */

import type {
  Program,
  Statement,
  Expression,
  LetStatement,
  AssignmentStatement,
  IfStatement,
  ForStatement,
  RenderStatement,
  ExpressionStatement,
  Literal,
  Identifier,
  BinaryExpression,
  UnaryExpression,
  TernaryExpression,
  CallExpression,
  MemberExpression,
  ArrayExpression,
  ObjectExpression,
} from './types.js';

import { isBuiltin, transformToJinja2 } from './builtins.js';

// =============================================================================
// TRANSPILER OPTIONS
// =============================================================================

export interface TranspilerOptions {
  /** Prefix for component context variable */
  contextVar?: string;
  /** Indent string (default: 4 spaces) */
  indent?: string;
  /** Whether to add data- prefix to semantic attributes */
  dataAttributes?: boolean;
  /** Component name (for includes) */
  componentName?: string;
}

const DEFAULT_OPTIONS: Required<TranspilerOptions> = {
  contextVar: 'ctx',
  indent: '    ',
  dataAttributes: true,
  componentName: 'component',
};

// =============================================================================
// TRANSPILER
// =============================================================================

export class Jinja2Transpiler {
  private options: Required<TranspilerOptions>;
  private currentIndent: number = 0;
  private output: string[] = [];

  constructor(options: TranspilerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  transpile(ast: Program): string {
    this.output = [];
    this.currentIndent = 0;

    // Add context setup
    this.emit(`{% set ${this.options.contextVar} = _component_context %}`);

    // Transpile body
    for (const statement of ast.body) {
      this.transpileStatement(statement);
    }

    return this.output.join('\n');
  }

  // ---------------------------------------------------------------------------
  // Statements
  // ---------------------------------------------------------------------------

  private transpileStatement(stmt: Statement): void {
    switch (stmt.type) {
      case 'LetStatement':
        this.transpileLetStatement(stmt);
        break;
      case 'AssignmentStatement':
        this.transpileAssignmentStatement(stmt);
        break;
      case 'IfStatement':
        this.transpileIfStatement(stmt);
        break;
      case 'ForStatement':
        this.transpileForStatement(stmt);
        break;
      case 'RenderStatement':
        this.transpileRenderStatement(stmt);
        break;
      case 'ExpressionStatement':
        this.transpileExpressionStatement(stmt);
        break;
    }
  }

  private transpileLetStatement(stmt: LetStatement): void {
    const value = this.transpileExpression(stmt.value);
    this.emit(`{% set ${stmt.name} = ${value} %}`);
  }

  private transpileAssignmentStatement(stmt: AssignmentStatement): void {
    const target = this.transpileExpression(stmt.target);
    const value = this.transpileExpression(stmt.value);
    this.emit(`{% set ${target} = ${value} %}`);
  }

  private transpileIfStatement(stmt: IfStatement): void {
    const condition = this.transpileExpression(stmt.condition);
    this.emit(`{% if ${condition} %}`);

    this.currentIndent++;
    for (const s of stmt.then) {
      this.transpileStatement(s);
    }
    this.currentIndent--;

    for (const elif of stmt.elif) {
      const elifCondition = this.transpileExpression(elif.condition);
      this.emit(`{% elif ${elifCondition} %}`);
      this.currentIndent++;
      for (const s of elif.then) {
        this.transpileStatement(s);
      }
      this.currentIndent--;
    }

    if (stmt.else) {
      this.emit(`{% else %}`);
      this.currentIndent++;
      for (const s of stmt.else) {
        this.transpileStatement(s);
      }
      this.currentIndent--;
    }

    this.emit(`{% endif %}`);
  }

  private transpileForStatement(stmt: ForStatement): void {
    const iterable = this.transpileExpression(stmt.iterable);
    const loopVar = stmt.index
      ? `${stmt.index}, ${stmt.variable}`
      : stmt.variable;

    this.emit(`{% for ${loopVar} in ${iterable} %}`);

    this.currentIndent++;
    for (const s of stmt.body) {
      this.transpileStatement(s);
    }
    this.currentIndent--;

    this.emit(`{% endfor %}`);
  }

  private transpileRenderStatement(stmt: RenderStatement): void {
    switch (stmt.method) {
      case 'element':
        this.transpileRenderElement(stmt);
        break;
      case 'slot':
        this.transpileRenderSlot(stmt);
        break;
      case 'text':
        this.transpileRenderText(stmt);
        break;
      case 'html':
        this.transpileRenderHtml(stmt);
        break;
      case 'component':
        this.transpileRenderComponent(stmt);
        break;
      default:
        // Generic render method
        this.emit(`{# render.${stmt.method}() #}`);
    }
  }

  private transpileRenderElement(stmt: RenderStatement): void {
    // Get tag name from first argument
    const tagArg = stmt.args[0];
    const tagName = tagArg?.type === 'Literal' ? String(tagArg.value) : 'div';

    // Collect attributes and conditional attributes from children (attrs.* assignments)
    const attributes: string[] = [];
    const conditionalAttrs: Array<{ condition: string; attrName: string; attrValue: string | null }> = [];

    if (stmt.children) {
      for (const child of stmt.children) {
        if (child.type === 'AssignmentStatement') {
          const target = child.target;
          if (target.type === 'MemberExpression' &&
              target.object.type === 'Identifier' &&
              (target.object as Identifier).name === 'attrs') {
            // Get attribute name - handle both dot notation and bracket notation
            let attrName: string;
            if (target.computed) {
              // Bracket notation: attrs["data-variant"]
              if (target.property.type === 'Literal' && typeof target.property.value === 'string') {
                attrName = target.property.value;
              } else {
                // Dynamic attribute name - skip for now
                continue;
              }
            } else {
              // Dot notation: attrs.class
              attrName = (target.property as Identifier).name;
            }

            const value = child.value;

            // Handle boolean literal: attrs.disabled = true -> disabled
            if (value.type === 'Literal' && typeof value.value === 'boolean') {
              if (value.value) {
                attributes.push(attrName);
              }
              // false values are omitted
            }
            // Handle string literal: attrs.class = "foo" -> class="foo"
            else if (value.type === 'Literal' && typeof value.value === 'string') {
              attributes.push(`${attrName}="${value.value}"`);
            }
            // Handle dynamic values: attrs.class = join(classes, " ") -> class="{{ classes | join(" ") }}"
            else {
              const attrValue = this.transpileExpression(value);
              attributes.push(`${attrName}="{{ ${attrValue} }}"`);
            }
          }
        }
        // Handle conditional attributes: if loading: attrs["aria-busy"] = "true"
        else if (child.type === 'IfStatement' && child.then.length === 1 && !child.else && child.elif.length === 0) {
          const innerStmt = child.then[0];
          if (innerStmt.type === 'AssignmentStatement' &&
              innerStmt.target.type === 'MemberExpression' &&
              innerStmt.target.object.type === 'Identifier' &&
              (innerStmt.target.object as Identifier).name === 'attrs') {
            // Get attribute name
            let attrName: string;
            if (innerStmt.target.computed && innerStmt.target.property.type === 'Literal') {
              attrName = String(innerStmt.target.property.value);
            } else {
              attrName = (innerStmt.target.property as Identifier).name;
            }
            const condition = this.transpileExpression(child.condition);

            // Handle different value types
            if (innerStmt.value.type === 'Literal' && innerStmt.value.value === true) {
              // Boolean true: attrs.disabled = true -> {% if condition %}disabled{% endif %}
              conditionalAttrs.push({ condition, attrName, attrValue: null });
            } else if (innerStmt.value.type === 'Literal' && typeof innerStmt.value.value === 'string') {
              // String literal: attrs["aria-busy"] = "true" -> {% if condition %}aria-busy="true"{% endif %}
              conditionalAttrs.push({ condition, attrName, attrValue: innerStmt.value.value });
            }
          }
        }
      }
    }

    // Build conditional attributes
    for (const { condition, attrName, attrValue } of conditionalAttrs) {
      if (attrValue === null) {
        attributes.push(`{% if ${condition} %}${attrName}{% endif %}`);
      } else {
        attributes.push(`{% if ${condition} %}${attrName}="${attrValue}"{% endif %}`);
      }
    }

    // Build opening tag
    const attrStr = attributes.length > 0 ? ' ' + attributes.join(' ') : '';
    this.emit(`<${tagName}${attrStr}>`);

    // Render non-attribute children (skip if statements that were converted to conditional attrs)
    if (stmt.children) {
      this.currentIndent++;
      for (const child of stmt.children) {
        // Skip attribute assignments
        if (child.type === 'AssignmentStatement' &&
            child.target.type === 'MemberExpression' &&
            child.target.object.type === 'Identifier' &&
            (child.target.object as Identifier).name === 'attrs') {
          continue;
        }
        // Skip if statements that were converted to conditional attributes
        if (child.type === 'IfStatement' && child.then.length === 1 && !child.else && child.elif.length === 0) {
          const innerStmt = child.then[0];
          if (innerStmt.type === 'AssignmentStatement' &&
              innerStmt.target.type === 'MemberExpression' &&
              innerStmt.target.object.type === 'Identifier' &&
              (innerStmt.target.object as Identifier).name === 'attrs' &&
              innerStmt.value.type === 'Literal') {
            // Skip both boolean true and string values that were converted to conditional attrs
            if (innerStmt.value.value === true || typeof innerStmt.value.value === 'string') {
              continue;
            }
          }
        }
        this.transpileStatement(child);
      }
      this.currentIndent--;
    }

    // Closing tag
    this.emit(`</${tagName}>`);
  }

  private transpileRenderSlot(stmt: RenderStatement): void {
    const slotArg = stmt.args[0];
    const slotName = slotArg?.type === 'Literal' ? String(slotArg.value) : 'default';

    if (slotName === 'default') {
      this.emit(`{{ ${this.options.contextVar}.content | safe }}`);
    } else {
      this.emit(`{% if ${this.options.contextVar}.${slotName} %}{{ ${this.options.contextVar}.${slotName} | safe }}{% endif %}`);
    }
  }

  private transpileRenderText(stmt: RenderStatement): void {
    const textArg = stmt.args[0];
    if (textArg) {
      const text = this.transpileExpression(textArg);
      this.emit(`{{ ${text} }}`);
    }
  }

  private transpileRenderHtml(stmt: RenderStatement): void {
    const htmlArg = stmt.args[0];
    if (htmlArg) {
      const html = this.transpileExpression(htmlArg);
      this.emit(`{{ ${html} | safe }}`);
    }
  }

  private transpileRenderComponent(stmt: RenderStatement): void {
    const componentArg = stmt.args[0];
    const componentName = componentArg?.type === 'Literal' ? String(componentArg.value) : 'unknown';

    // Build context for the component
    const contextParts: string[] = [];
    if (stmt.attributes) {
      for (const [key, value] of Object.entries(stmt.attributes)) {
        contextParts.push(`"${key}": ${this.transpileExpression(value)}`);
      }
    }

    const contextStr = contextParts.length > 0
      ? `{% set _component_context = {${contextParts.join(', ')}} %}`
      : '';

    if (contextStr) {
      this.emit(contextStr);
    }
    this.emit(`{% include "components/${componentName}.html.j2" with context %}`);
  }

  private transpileExpressionStatement(stmt: ExpressionStatement): void {
    // Usually a function call
    const expr = this.transpileExpression(stmt.expression);
    this.emit(`{{ ${expr} }}`);
  }

  // ---------------------------------------------------------------------------
  // Expressions
  // ---------------------------------------------------------------------------

  private transpileExpression(expr: Expression): string {
    switch (expr.type) {
      case 'Literal':
        return this.transpileLiteral(expr);
      case 'Identifier':
        return this.transpileIdentifier(expr);
      case 'BinaryExpression':
        return this.transpileBinaryExpression(expr);
      case 'UnaryExpression':
        return this.transpileUnaryExpression(expr);
      case 'TernaryExpression':
        return this.transpileTernaryExpression(expr);
      case 'CallExpression':
        return this.transpileCallExpression(expr);
      case 'MemberExpression':
        return this.transpileMemberExpression(expr);
      case 'ArrayExpression':
        return this.transpileArrayExpression(expr);
      case 'ObjectExpression':
        return this.transpileObjectExpression(expr);
      default:
        return '/* unknown expression */';
    }
  }

  private transpileLiteral(expr: Literal): string {
    if (typeof expr.value === 'string') {
      return `"${expr.value.replace(/"/g, '\\"')}"`;
    }
    if (typeof expr.value === 'boolean') {
      return expr.value ? 'True' : 'False';
    }
    return String(expr.value);
  }

  private transpileIdentifier(expr: Identifier): string {
    // Map 'props' to context variable
    if (expr.name === 'props') {
      return this.options.contextVar;
    }
    return expr.name;
  }

  private transpileBinaryExpression(expr: BinaryExpression): string {
    const left = this.transpileExpression(expr.left);
    const right = this.transpileExpression(expr.right);

    // Handle string concatenation: use ~ operator in Jinja2
    // Detect string context when either operand is a string literal
    if (expr.operator === '+') {
      const leftIsString = expr.left.type === 'Literal' && typeof expr.left.value === 'string';
      const rightIsString = expr.right.type === 'Literal' && typeof expr.right.value === 'string';
      const leftIsArray = expr.left.type === 'ArrayExpression';
      const rightIsArray = expr.right.type === 'ArrayExpression';

      // Use ~ for string concatenation, + for arrays
      if ((leftIsString || rightIsString) && !leftIsArray && !rightIsArray) {
        return `(${left} ~ ${right})`;
      }
    }

    // Map operators to Jinja2
    const opMap: Record<string, string> = {
      '==': '==',
      '!=': '!=',
      '<': '<',
      '<=': '<=',
      '>': '>',
      '>=': '>=',
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '/',
      'and': 'and',
      'or': 'or',
    };

    const op = opMap[expr.operator] ?? expr.operator;
    return `(${left} ${op} ${right})`;
  }

  private transpileUnaryExpression(expr: UnaryExpression): string {
    const arg = this.transpileExpression(expr.argument);
    if (expr.operator === 'not') {
      return `not ${arg}`;
    }
    return `${expr.operator}${arg}`;
  }

  private transpileTernaryExpression(expr: TernaryExpression): string {
    const condition = this.transpileExpression(expr.condition);
    const consequent = this.transpileExpression(expr.consequent);
    const alternate = this.transpileExpression(expr.alternate);
    return `(${consequent} if ${condition} else ${alternate})`;
  }

  private transpileCallExpression(expr: CallExpression): string {
    // Check if this is a builtin function call
    if (expr.callee.type === 'Identifier') {
      const funcName = expr.callee.name;
      if (isBuiltin(funcName)) {
        const args = expr.arguments.map((a) => this.transpileExpression(a));
        const result = transformToJinja2(funcName, args);
        if (result !== null) {
          return result;
        }
      }
    }

    // Default: regular function call
    const callee = this.transpileExpression(expr.callee);
    const args = expr.arguments.map((a) => this.transpileExpression(a)).join(', ');
    return `${callee}(${args})`;
  }

  private transpileMemberExpression(expr: MemberExpression): string {
    let object = this.transpileExpression(expr.object);

    // Map 'props' to context variable
    if (expr.object.type === 'Identifier' && expr.object.name === 'props') {
      object = this.options.contextVar;
    }

    if (expr.computed) {
      const property = this.transpileExpression(expr.property);
      return `${object}[${property}]`;
    } else {
      const property = (expr.property as Identifier).name;
      return `${object}.${property}`;
    }
  }

  private transpileArrayExpression(expr: ArrayExpression): string {
    const elements = expr.elements.map((e) => this.transpileExpression(e)).join(', ');
    return `[${elements}]`;
  }

  private transpileObjectExpression(expr: ObjectExpression): string {
    const properties = expr.properties
      .map((p) => `"${p.key}": ${this.transpileExpression(p.value)}`)
      .join(', ');
    return `{${properties}}`;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private emit(line: string): void {
    const indent = this.options.indent.repeat(this.currentIndent);
    this.output.push(indent + line);
  }
}

/**
 * Transpile RigScript AST to Jinja2 template
 */
export function transpileToJinja2(ast: Program, options?: TranspilerOptions): string {
  const transpiler = new Jinja2Transpiler(options);
  return transpiler.transpile(ast);
}

/**
 * Lord of the Components - RigScript Generator
 *
 * Converts Intermediate Representation (IR) from template analyzers
 * into formatted RigScript (.rig) files.
 */

import {
  analyzeJinja2Template,
  type TemplateIR,
  type TemplateNodeIR,
  type ElementIR,
  type AttributeIR,
  type AttributeValueIR,
  type ExpressionIR,
  type VariableDeclarationIR,
  type ConditionalIR,
  type LoopIR,
  type ExpressionOutputIR,
  type TextIR,
  type CommentIR,
  type FilterIR,
  type FilteredExpressionIR,
} from './jinja2-analyzer.js';

// =============================================================================
// GENERATOR OPTIONS
// =============================================================================

export interface GeneratorOptions {
  /** Indentation string (default: 4 spaces) */
  indent?: string;
  /** Include comments from source template */
  includeComments?: boolean;
  /** Component name for the header comment */
  componentName?: string;
  /** Map ctx.x to props.x (default: true) */
  mapCtxToProps?: boolean;
  /** Map content|safe to render.slot("default") (default: true) */
  mapContentToSlot?: boolean;
}

// =============================================================================
// RIGSCRIPT GENERATOR CLASS
// =============================================================================

export class RigScriptGenerator {
  private options: Required<GeneratorOptions>;
  private output: string[] = [];
  private currentIndent: number = 0;

  constructor(options: GeneratorOptions = {}) {
    this.options = {
      indent: options.indent ?? '    ',
      includeComments: options.includeComments ?? true,
      componentName: options.componentName ?? 'Component',
      mapCtxToProps: options.mapCtxToProps ?? true,
      mapContentToSlot: options.mapContentToSlot ?? true,
    };
  }

  /**
   * Generate RigScript from template IR
   */
  generate(ir: TemplateIR): string {
    this.output = [];
    this.currentIndent = 0;

    // Header comment
    this.emit(`# Lord of the Components - ${this.options.componentName} Logic`);
    if (ir.comment) {
      this.emit(`# ${ir.comment}`);
    }
    this.emit('');

    // Variable declarations
    for (const variable of ir.variables) {
      this.generateVariableDeclaration(variable);
    }

    if (ir.variables.length > 0) {
      this.emit('');
    }

    // Body
    for (const node of ir.body) {
      this.generateNode(node);
    }

    return this.output.join('\n');
  }

  // ===========================================================================
  // NODE GENERATION
  // ===========================================================================

  private generateNode(node: TemplateNodeIR): void {
    switch (node.type) {
      case 'Element':
        this.generateElement(node);
        break;
      case 'Text':
        this.generateText(node);
        break;
      case 'ExpressionOutput':
        this.generateExpressionOutput(node);
        break;
      case 'Conditional':
        this.generateConditional(node);
        break;
      case 'Loop':
        this.generateLoop(node);
        break;
      case 'Comment':
        this.generateComment(node);
        break;
    }
  }

  private generateElement(element: ElementIR): void {
    const tag = element.tag.toLowerCase();

    // Start render.element call
    this.emit(`render.element("${tag}"):`);
    this.indent();

    // Generate attributes
    this.generateAttributes(element.attributes);

    // Generate children
    if (element.children.length > 0) {
      for (const child of element.children) {
        this.generateNode(child);
      }
    } else if (element.attributes.length === 0) {
      // Empty element needs a pass statement
      this.emit('pass');
    }

    this.dedent();
  }

  private generateAttributes(attributes: AttributeIR[]): void {
    for (const attr of attributes) {
      if (attr.conditional) {
        // Conditional attribute
        this.emit(`if ${this.generateExpression(attr.conditional)}:`);
        this.indent();
        this.generateAttribute(attr);
        this.dedent();
      } else {
        this.generateAttribute(attr);
      }
    }
  }

  private generateAttribute(attr: AttributeIR): void {
    const name = attr.name;
    const value = this.generateAttributeValue(attr.value);

    // Handle special attribute names
    if (name.includes('-') || name.includes(':')) {
      this.emit(`attrs["${name}"] = ${value}`);
    } else {
      this.emit(`attrs.${name} = ${value}`);
    }
  }

  private generateAttributeValue(value: AttributeValueIR): string {
    switch (value.type) {
      case 'static':
        if (value.value === 'true') {
          return 'true';
        }
        if (value.value === 'false') {
          return 'false';
        }
        return `"${this.escapeString(value.value)}"`;

      case 'dynamic':
        return this.generateExpression(value.expression);

      case 'mixed':
        // Build string concatenation
        const parts = value.parts.map(part => {
          if (part.type === 'static') {
            return `"${this.escapeString(part.value as string)}"`;
          } else {
            return this.generateExpression(part.value as ExpressionIR);
          }
        });
        return parts.join(' + ');
    }
  }

  private generateText(text: TextIR): void {
    const trimmed = text.value.trim();
    if (trimmed) {
      this.emit(`render.text("${this.escapeString(trimmed)}")`);
    }
  }

  private generateExpressionOutput(output: ExpressionOutputIR): void {
    // Check for content|safe pattern -> render.slot("default")
    if (this.options.mapContentToSlot && this.isContentSafePattern(output)) {
      this.emit('render.slot("default")');
      return;
    }

    // Check for safe filter (raw HTML)
    if (this.hasSafeFilter(output.filters)) {
      this.emit(`render.html(${this.generateExpression(output.expression)})`);
      return;
    }

    // Regular text output
    const expr = this.applyFilters(output.expression, output.filters);
    this.emit(`render.text(${this.generateExpression(expr)})`);
  }

  private generateConditional(cond: ConditionalIR): void {
    this.emit(`if ${this.generateExpression(cond.condition)}:`);
    this.indent();

    if (cond.then.length === 0) {
      this.emit('pass');
    } else {
      for (const node of cond.then) {
        this.generateNode(node);
      }
    }

    this.dedent();

    // Elif branches
    for (const elif of cond.elif) {
      this.emit(`elif ${this.generateExpression(elif.condition)}:`);
      this.indent();

      if (elif.then.length === 0) {
        this.emit('pass');
      } else {
        for (const node of elif.then) {
          this.generateNode(node);
        }
      }

      this.dedent();
    }

    // Else branch
    if (cond.else) {
      this.emit('else:');
      this.indent();

      if (cond.else.length === 0) {
        this.emit('pass');
      } else {
        for (const node of cond.else) {
          this.generateNode(node);
        }
      }

      this.dedent();
    }
  }

  private generateLoop(loop: LoopIR): void {
    let loopVar = loop.variable;
    if (loop.index) {
      loopVar = `${loop.index}, ${loop.variable}`;
    }

    this.emit(`for ${loopVar} in ${this.generateExpression(loop.iterable)}:`);
    this.indent();

    if (loop.body.length === 0) {
      this.emit('pass');
    } else {
      for (const node of loop.body) {
        this.generateNode(node);
      }
    }

    this.dedent();
  }

  private generateComment(comment: CommentIR): void {
    if (this.options.includeComments) {
      this.emit(`# ${comment.value}`);
    }
  }

  private generateVariableDeclaration(decl: VariableDeclarationIR): void {
    const value = this.generateExpression(decl.value);
    this.emit(`let ${decl.name} = ${value}`);
  }

  // ===========================================================================
  // EXPRESSION GENERATION
  // ===========================================================================

  private generateExpression(expr: ExpressionIR): string {
    switch (expr.type) {
      case 'Literal':
        return this.generateLiteral(expr.value);

      case 'Identifier':
        return this.transformIdentifier(expr.name);

      case 'MemberAccess':
        return this.generateMemberAccess(expr);

      case 'BinaryOperation':
        return this.generateBinaryOperation(expr);

      case 'UnaryOperation':
        return `${expr.operator} ${this.generateExpression(expr.argument)}`;

      case 'Call':
        return this.generateCall(expr);

      case 'FilteredExpression':
        return this.generateFilteredExpression(expr);

      case 'Array':
        const elements = expr.elements.map(e => this.generateExpression(e));
        return `[${elements.join(', ')}]`;

      case 'Ternary':
        return `${this.generateExpression(expr.consequent)} if ${this.generateExpression(expr.condition)} else ${this.generateExpression(expr.alternate)}`;

      case 'Comparison':
        return `${this.generateExpression(expr.left)} ${expr.operator} ${this.generateExpression(expr.right)}`;

      default:
        return '/* unknown expression */';
    }
  }

  private generateLiteral(value: string | number | boolean | null): string {
    if (value === null) {
      return 'null';
    }
    if (typeof value === 'string') {
      return `"${this.escapeString(value)}"`;
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    return String(value);
  }

  private transformIdentifier(name: string): string {
    // Map ctx to props if enabled
    if (this.options.mapCtxToProps && name === 'ctx') {
      return 'props';
    }
    return name;
  }

  private generateMemberAccess(expr: { type: 'MemberAccess'; object: ExpressionIR; property: string; computed: boolean }): string {
    const obj = this.generateExpression(expr.object);

    if (expr.computed) {
      return `${obj}["${expr.property}"]`;
    }

    // Transform ctx.x to props.x
    if (this.options.mapCtxToProps && obj === 'props' && expr.object.type === 'Identifier') {
      // Already transformed, use as-is
    }

    return `${obj}.${expr.property}`;
  }

  private generateBinaryOperation(expr: { type: 'BinaryOperation'; operator: string; left: ExpressionIR; right: ExpressionIR }): string {
    const left = this.generateExpression(expr.left);
    const right = this.generateExpression(expr.right);

    // Map Jinja2 ~ to + for string concatenation
    const op = expr.operator === '~' ? '+' : expr.operator;

    return `${left} ${op} ${right}`;
  }

  private generateCall(expr: { type: 'Call'; callee: ExpressionIR; arguments: ExpressionIR[] }): string {
    const callee = this.generateExpression(expr.callee);
    const args = expr.arguments.map(a => this.generateExpression(a));
    return `${callee}(${args.join(', ')})`;
  }

  private generateFilteredExpression(expr: FilteredExpressionIR): string {
    // Convert Jinja2 filters to RigScript builtins
    let result = this.generateExpression(expr.expression);

    for (const filter of expr.filters) {
      result = this.applyFilter(result, filter);
    }

    return result;
  }

  private applyFilter(expr: string, filter: FilterIR): string {
    const args = filter.arguments.map(a => this.generateExpression(a));

    switch (filter.name) {
      case 'default':
        // value | default(x) -> default(value, x) or value or x
        if (args.length > 0) {
          return `default(${expr}, ${args[0]})`;
        }
        return expr;

      case 'join':
        // items | join(sep) -> join(items, sep)
        if (args.length > 0) {
          return `join(${expr}, ${args[0]})`;
        }
        return `join(${expr}, "")`;

      case 'safe':
        // Handled at higher level for render.html
        return expr;

      case 'trim':
        return `trim(${expr})`;

      case 'lower':
        return `lower(${expr})`;

      case 'upper':
        return `upper(${expr})`;

      case 'capitalize':
        return `capitalize(${expr})`;

      case 'title':
        return `title(${expr})`;

      case 'length':
        return `length(${expr})`;

      case 'first':
        return `first(${expr})`;

      case 'last':
        return `last(${expr})`;

      case 'reverse':
        return `reverse(${expr})`;

      case 'sort':
        return `sort(${expr})`;

      case 'e':
      case 'escape':
        // Escape is default, no special handling needed
        return expr;

      default:
        // Unknown filter - generate as a function call
        if (args.length > 0) {
          return `${filter.name}(${expr}, ${args.join(', ')})`;
        }
        return `${filter.name}(${expr})`;
    }
  }

  private applyFilters(expr: ExpressionIR, filters: FilterIR[]): ExpressionIR {
    // Skip safe filter for text output
    const nonSafeFilters = filters.filter(f => f.name !== 'safe');
    if (nonSafeFilters.length === 0) {
      return expr;
    }
    return {
      type: 'FilteredExpression',
      expression: expr,
      filters: nonSafeFilters,
    };
  }

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  private isContentSafePattern(output: ExpressionOutputIR): boolean {
    // Check if this is {{ content | safe }} or similar slot pattern
    const expr = output.expression;
    const hasSafe = output.filters.some(f => f.name === 'safe');

    if (!hasSafe) {
      return false;
    }

    // Check for common slot variable names
    if (expr.type === 'Identifier') {
      const slotNames = ['content', 'children', 'slot', 'body', 'inner'];
      return slotNames.includes(expr.name.toLowerCase());
    }

    // Check for ctx.content, ctx.children, etc.
    if (expr.type === 'MemberAccess') {
      const slotNames = ['content', 'children', 'slot', 'body', 'inner'];
      return slotNames.includes(expr.property.toLowerCase());
    }

    return false;
  }

  private hasSafeFilter(filters: FilterIR[]): boolean {
    return filters.some(f => f.name === 'safe');
  }

  private escapeString(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  private emit(line: string): void {
    if (line === '') {
      this.output.push('');
    } else {
      this.output.push(this.getIndent() + line);
    }
  }

  private getIndent(): string {
    return this.options.indent.repeat(this.currentIndent);
  }

  private indent(): void {
    this.currentIndent++;
  }

  private dedent(): void {
    if (this.currentIndent > 0) {
      this.currentIndent--;
    }
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Generate RigScript from template IR
 */
export function generateRigScript(ir: TemplateIR, options?: GeneratorOptions): string {
  const generator = new RigScriptGenerator(options);
  return generator.generate(ir);
}

/**
 * Convert a Jinja2 template source to RigScript
 */
export function jinja2ToRigScript(source: string, options?: GeneratorOptions): string {
  const ir = analyzeJinja2Template(source);
  return generateRigScript(ir, options);
}

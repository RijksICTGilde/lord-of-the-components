/**
 * Lord of the Components - Jinja2 Template Analyzer
 *
 * Parses Jinja2 templates and extracts their structure into an
 * Intermediate Representation (IR) for conversion to RigScript.
 */

// =============================================================================
// INTERMEDIATE REPRESENTATION TYPES
// =============================================================================

export interface TemplateIR {
  type: 'Template';
  comment?: string;
  variables: VariableDeclarationIR[];
  body: TemplateNodeIR[];
}

export type TemplateNodeIR =
  | ElementIR
  | TextIR
  | ExpressionOutputIR
  | ConditionalIR
  | LoopIR
  | CommentIR;

export interface ElementIR {
  type: 'Element';
  tag: string;
  attributes: AttributeIR[];
  children: TemplateNodeIR[];
  selfClosing: boolean;
}

export interface AttributeIR {
  name: string;
  value: AttributeValueIR;
  conditional?: ExpressionIR; // For {% if x %}attr="value"{% endif %}
}

export type AttributeValueIR =
  | { type: 'static'; value: string }
  | { type: 'dynamic'; expression: ExpressionIR }
  | { type: 'mixed'; parts: Array<{ type: 'static' | 'dynamic'; value: string | ExpressionIR }> };

export interface TextIR {
  type: 'Text';
  value: string;
}

export interface ExpressionOutputIR {
  type: 'ExpressionOutput';
  expression: ExpressionIR;
  filters: FilterIR[];
}

export interface ConditionalIR {
  type: 'Conditional';
  condition: ExpressionIR;
  then: TemplateNodeIR[];
  elif: Array<{ condition: ExpressionIR; then: TemplateNodeIR[] }>;
  else: TemplateNodeIR[] | null;
}

export interface LoopIR {
  type: 'Loop';
  variable: string;
  index?: string;
  iterable: ExpressionIR;
  body: TemplateNodeIR[];
}

export interface CommentIR {
  type: 'Comment';
  value: string;
}

export interface VariableDeclarationIR {
  type: 'VariableDeclaration';
  name: string;
  value: ExpressionIR;
}

// =============================================================================
// EXPRESSION TYPES
// =============================================================================

export type ExpressionIR =
  | LiteralIR
  | IdentifierIR
  | MemberAccessIR
  | BinaryOperationIR
  | UnaryOperationIR
  | CallIR
  | FilteredExpressionIR
  | ArrayIR
  | TernaryIR
  | ComparisonIR;

export interface LiteralIR {
  type: 'Literal';
  value: string | number | boolean | null;
}

export interface IdentifierIR {
  type: 'Identifier';
  name: string;
}

export interface MemberAccessIR {
  type: 'MemberAccess';
  object: ExpressionIR;
  property: string;
  computed: boolean; // obj['key'] vs obj.key
}

export interface BinaryOperationIR {
  type: 'BinaryOperation';
  operator: '+' | '-' | '*' | '/' | 'and' | 'or' | '~' | 'in' | 'not in';
  left: ExpressionIR;
  right: ExpressionIR;
}

export interface UnaryOperationIR {
  type: 'UnaryOperation';
  operator: 'not' | '-';
  argument: ExpressionIR;
}

export interface CallIR {
  type: 'Call';
  callee: ExpressionIR;
  arguments: ExpressionIR[];
}

export interface FilteredExpressionIR {
  type: 'FilteredExpression';
  expression: ExpressionIR;
  filters: FilterIR[];
}

export interface FilterIR {
  name: string;
  arguments: ExpressionIR[];
}

export interface ArrayIR {
  type: 'Array';
  elements: ExpressionIR[];
}

export interface TernaryIR {
  type: 'Ternary';
  condition: ExpressionIR;
  consequent: ExpressionIR;
  alternate: ExpressionIR;
}

export interface ComparisonIR {
  type: 'Comparison';
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'is' | 'is not';
  left: ExpressionIR;
  right: ExpressionIR;
}

// =============================================================================
// ANALYZER CLASS
// =============================================================================

interface AnalyzerOptions {
  contextVariable?: string; // Default: 'ctx'
}

export class Jinja2Analyzer {
  private source: string = '';
  private pos: number = 0;
  private options: AnalyzerOptions;

  constructor(options: AnalyzerOptions = {}) {
    this.options = {
      contextVariable: options.contextVariable ?? 'ctx',
    };
  }

  /**
   * Analyze a Jinja2 template and return its IR
   */
  analyze(source: string): TemplateIR {
    this.source = source;
    this.pos = 0;

    const comment = this.extractTemplateComment();
    const variables: VariableDeclarationIR[] = [];
    const body: TemplateNodeIR[] = [];

    while (this.pos < this.source.length) {
      // Skip the context assignment line ({% set ctx = _component_context %})
      if (this.lookingAt('{% set ctx = _component_context %}') ||
          this.lookingAt('{% set ctx=_component_context %}')) {
        this.skipPast('%}');
        this.skipWhitespace();
        continue;
      }

      // Check for variable declarations ({% set ... %})
      if (this.lookingAt('{% set ')) {
        const decl = this.parseSetStatement();
        if (decl) {
          variables.push(decl);
        }
        continue;
      }

      // Parse other content
      const node = this.parseNode();
      if (node) {
        // Skip empty text nodes
        if (node.type === 'Text' && node.value.trim() === '') {
          continue;
        }
        body.push(node);
      }
    }

    return {
      type: 'Template',
      comment,
      variables,
      body,
    };
  }

  /**
   * Extract template comment at the beginning ({# ... #})
   */
  private extractTemplateComment(): string | undefined {
    this.skipWhitespace();
    if (this.lookingAt('{#')) {
      const start = this.pos + 2;
      const end = this.source.indexOf('#}', start);
      if (end !== -1) {
        const comment = this.source.slice(start, end).trim();
        this.pos = end + 2;
        this.skipWhitespace();
        return comment;
      }
    }
    return undefined;
  }

  /**
   * Parse a {% set name = value %} statement
   */
  private parseSetStatement(): VariableDeclarationIR | null {
    if (!this.consume('{% set ')) {
      return null;
    }

    this.skipWhitespace();
    const name = this.parseIdentifierName();
    if (!name) {
      this.skipPast('%}');
      return null;
    }

    this.skipWhitespace();
    if (!this.consume('=')) {
      this.skipPast('%}');
      return null;
    }

    this.skipWhitespace();
    let value = this.parseExpression();

    // Parse filters after the expression (e.g., ctx.variant | default('primary'))
    this.skipWhitespace();
    const filters: FilterIR[] = [];
    while (this.lookingAt('|') && !this.lookingAt('%}')) {
      this.consume('|');
      this.skipWhitespace();
      const filter = this.parseFilter();
      if (filter) {
        filters.push(filter);
      }
      this.skipWhitespace();
    }

    // Wrap expression with filters if present
    if (filters.length > 0) {
      value = {
        type: 'FilteredExpression',
        expression: value,
        filters,
      };
    }

    this.skipWhitespace();
    this.consume('%}');
    this.skipWhitespace();

    return {
      type: 'VariableDeclaration',
      name,
      value,
    };
  }

  /**
   * Parse any template node (element, text, expression, etc.)
   */
  private parseNode(): TemplateNodeIR | null {
    this.skipWhitespace();

    if (this.pos >= this.source.length) {
      return null;
    }

    // Jinja2 comment
    if (this.lookingAt('{#')) {
      return this.parseJinjaComment();
    }

    // Jinja2 conditional
    if (this.lookingAt('{% if ')) {
      return this.parseConditional();
    }

    // Jinja2 loop
    if (this.lookingAt('{% for ')) {
      return this.parseLoop();
    }

    // Jinja2 expression output
    if (this.lookingAt('{{')) {
      return this.parseExpressionOutput();
    }

    // HTML element
    if (this.lookingAt('<') && !this.lookingAt('</')) {
      return this.parseElement();
    }

    // Text content
    return this.parseText();
  }

  /**
   * Parse a Jinja2 comment {# ... #}
   */
  private parseJinjaComment(): CommentIR | null {
    if (!this.consume('{#')) {
      return null;
    }

    const start = this.pos;
    const end = this.source.indexOf('#}', start);
    if (end === -1) {
      return null;
    }

    const value = this.source.slice(start, end).trim();
    this.pos = end + 2;

    return {
      type: 'Comment',
      value,
    };
  }

  /**
   * Parse a Jinja2 conditional {% if ... %}
   */
  private parseConditional(): ConditionalIR | null {
    if (!this.consume('{% if ')) {
      return null;
    }

    const condition = this.parseExpression();
    this.skipWhitespace();
    this.consume('%}');

    const thenBranch = this.parseUntilEndTag(['{% elif ', '{% else %}', '{% endif %}']);
    const elifBranches: Array<{ condition: ExpressionIR; then: TemplateNodeIR[] }> = [];

    while (this.lookingAt('{% elif ')) {
      this.consume('{% elif ');
      const elifCondition = this.parseExpression();
      this.skipWhitespace();
      this.consume('%}');
      const elifThen = this.parseUntilEndTag(['{% elif ', '{% else %}', '{% endif %}']);
      elifBranches.push({ condition: elifCondition, then: elifThen });
    }

    let elseBranch: TemplateNodeIR[] | null = null;
    if (this.consume('{% else %}')) {
      elseBranch = this.parseUntilEndTag(['{% endif %}']);
    }

    this.consume('{% endif %}');

    return {
      type: 'Conditional',
      condition,
      then: thenBranch,
      elif: elifBranches,
      else: elseBranch,
    };
  }

  /**
   * Parse a Jinja2 loop {% for ... %}
   */
  private parseLoop(): LoopIR | null {
    if (!this.consume('{% for ')) {
      return null;
    }

    this.skipWhitespace();

    // Check for index, variable pattern
    let variable: string;
    let index: string | undefined;

    const first = this.parseIdentifierName();
    if (!first) {
      return null;
    }

    this.skipWhitespace();
    if (this.consume(',')) {
      this.skipWhitespace();
      index = first;
      variable = this.parseIdentifierName() || '';
      this.skipWhitespace();
    } else {
      variable = first;
    }

    if (!this.consume(' in ') && !this.consume('in ')) {
      this.skipWhitespace();
      this.consume('in');
      this.skipWhitespace();
    }

    const iterable = this.parseExpression();
    this.skipWhitespace();
    this.consume('%}');

    const body = this.parseUntilEndTag(['{% endfor %}']);
    this.consume('{% endfor %}');

    return {
      type: 'Loop',
      variable,
      index,
      iterable,
      body,
    };
  }

  /**
   * Parse nodes until we hit one of the end tags
   */
  private parseUntilEndTag(endTags: string[]): TemplateNodeIR[] {
    const nodes: TemplateNodeIR[] = [];

    while (this.pos < this.source.length) {
      // Check if we've reached an end tag
      for (const tag of endTags) {
        if (this.lookingAt(tag)) {
          return nodes;
        }
      }

      const node = this.parseNode();
      if (node) {
        if (node.type === 'Text' && node.value.trim() === '') {
          continue;
        }
        nodes.push(node);
      }
    }

    return nodes;
  }

  /**
   * Parse a Jinja2 expression output {{ ... }}
   */
  private parseExpressionOutput(): ExpressionOutputIR | null {
    if (!this.consume('{{')) {
      return null;
    }

    this.skipWhitespace();
    const expression = this.parseExpression();
    const filters: FilterIR[] = [];

    // Parse filters
    while (this.lookingAt('|')) {
      this.consume('|');
      this.skipWhitespace();
      const filter = this.parseFilter();
      if (filter) {
        filters.push(filter);
      }
    }

    this.skipWhitespace();
    this.consume('}}');

    return {
      type: 'ExpressionOutput',
      expression,
      filters,
    };
  }

  /**
   * Parse a Jinja2 filter (e.g., `default('primary')`)
   */
  private parseFilter(): FilterIR | null {
    const name = this.parseIdentifierName();
    if (!name) {
      return null;
    }

    const args: ExpressionIR[] = [];

    this.skipWhitespace();
    if (this.consume('(')) {
      this.skipWhitespace();
      while (!this.lookingAt(')') && this.pos < this.source.length) {
        const arg = this.parseExpression();
        args.push(arg);
        this.skipWhitespace();
        if (!this.consume(',')) {
          break;
        }
        this.skipWhitespace();
      }
      this.consume(')');
    }

    return { name, arguments: args };
  }

  /**
   * Parse an HTML element
   */
  private parseElement(): ElementIR | null {
    if (!this.consume('<')) {
      return null;
    }

    const tag = this.parseTagName();
    if (!tag) {
      return null;
    }

    const attributes = this.parseAttributes();

    // Self-closing or void element
    const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
    const isVoidElement = voidElements.includes(tag.toLowerCase());
    const selfClosing = this.consume('/>') || isVoidElement;

    // Consume the closing > if we haven't consumed /> and this is a void element
    if (!this.lookingAt('/>')) {
      this.consume('>');
    }

    const children: TemplateNodeIR[] = [];

    if (!selfClosing) {
      // Parse children until closing tag
      const closeTag = `</${tag}>`;
      while (this.pos < this.source.length && !this.lookingAt(closeTag) && !this.lookingAtIgnoreCase(closeTag)) {
        const child = this.parseNode();
        if (child) {
          children.push(child);
        }
      }
      // Consume closing tag
      this.consume(closeTag) || this.consumeIgnoreCase(closeTag);
    }

    return {
      type: 'Element',
      tag,
      attributes,
      children,
      selfClosing,
    };
  }

  /**
   * Parse HTML attributes
   */
  private parseAttributes(): AttributeIR[] {
    const attributes: AttributeIR[] = [];

    while (true) {
      this.skipWhitespace();

      // End of attributes
      if (this.lookingAt('>') || this.lookingAt('/>')) {
        break;
      }

      // Conditional attribute: {% if x %}attr="value"{% endif %}
      if (this.lookingAt('{% if ')) {
        const conditionalAttrs = this.parseConditionalAttribute();
        attributes.push(...conditionalAttrs);
        continue;
      }

      // Regular attribute
      const attr = this.parseAttribute();
      if (attr) {
        attributes.push(attr);
      } else {
        break;
      }
    }

    return attributes;
  }

  /**
   * Parse a single HTML attribute
   */
  private parseAttribute(): AttributeIR | null {
    const name = this.parseAttributeName();
    if (!name) {
      return null;
    }

    this.skipWhitespace();

    // Boolean attribute (no value)
    if (!this.lookingAt('=')) {
      return {
        name,
        value: { type: 'static', value: 'true' },
      };
    }

    this.consume('=');
    this.skipWhitespace();

    const value = this.parseAttributeValue();

    return {
      name,
      value,
    };
  }

  /**
   * Parse conditional attributes {% if x %}attr="value"{% endif %}
   */
  private parseConditionalAttribute(): AttributeIR[] {
    const attrs: AttributeIR[] = [];

    if (!this.consume('{% if ')) {
      return attrs;
    }

    const condition = this.parseExpression();
    this.skipWhitespace();
    this.consume('%}');
    this.skipWhitespace();

    // Parse attributes inside the conditional
    while (this.pos < this.source.length && !this.lookingAt('{% endif %}') && !this.lookingAt('{% else %}') && !this.lookingAt('>') && !this.lookingAt('/>')) {
      const attr = this.parseAttribute();
      if (attr) {
        attr.conditional = condition;
        attrs.push(attr);
      } else {
        // Could be just text or we've hit the end
        break;
      }
      this.skipWhitespace();
    }

    this.consume('{% endif %}');

    return attrs;
  }

  /**
   * Parse an attribute value (static, dynamic, or mixed)
   */
  private parseAttributeValue(): AttributeValueIR {
    const quote = this.peek();
    if (quote !== '"' && quote !== "'") {
      // Unquoted value
      const value = this.parseUnquotedValue();
      return { type: 'static', value };
    }

    this.advance(); // Consume opening quote
    const parts: Array<{ type: 'static' | 'dynamic'; value: string | ExpressionIR }> = [];
    let currentStatic = '';

    while (this.pos < this.source.length && this.peek() !== quote) {
      if (this.lookingAt('{{')) {
        // Save current static part
        if (currentStatic) {
          parts.push({ type: 'static', value: currentStatic });
          currentStatic = '';
        }

        // Parse expression
        this.consume('{{');
        this.skipWhitespace();
        const expr = this.parseExpression();

        // Check for filters in attribute value
        const filters: FilterIR[] = [];
        while (this.lookingAt('|')) {
          this.consume('|');
          this.skipWhitespace();
          const filter = this.parseFilter();
          if (filter) {
            filters.push(filter);
          }
        }

        // Apply filters to expression
        let finalExpr: ExpressionIR = expr;
        if (filters.length > 0) {
          finalExpr = {
            type: 'FilteredExpression',
            expression: expr,
            filters,
          };
        }

        parts.push({ type: 'dynamic', value: finalExpr });
        this.skipWhitespace();
        this.consume('}}');
      } else {
        currentStatic += this.advance();
      }
    }

    this.advance(); // Consume closing quote

    // Add remaining static content
    if (currentStatic) {
      parts.push({ type: 'static', value: currentStatic });
    }

    // Simplify the result
    if (parts.length === 0) {
      return { type: 'static', value: '' };
    }

    if (parts.length === 1) {
      if (parts[0].type === 'static') {
        return { type: 'static', value: parts[0].value as string };
      } else {
        return { type: 'dynamic', expression: parts[0].value as ExpressionIR };
      }
    }

    return { type: 'mixed', parts };
  }

  /**
   * Parse text content
   */
  private parseText(): TextIR | null {
    let text = '';

    while (this.pos < this.source.length) {
      if (this.lookingAt('{{') || this.lookingAt('{%') || this.lookingAt('{#') || this.lookingAt('<')) {
        break;
      }
      text += this.advance();
    }

    if (!text) {
      return null;
    }

    return {
      type: 'Text',
      value: text,
    };
  }

  // ===========================================================================
  // EXPRESSION PARSING
  // ===========================================================================

  /**
   * Parse an expression (handles operators, filters, etc.)
   */
  private parseExpression(): ExpressionIR {
    return this.parseOr();
  }

  private parseOr(): ExpressionIR {
    let left = this.parseAnd();

    while (this.lookingAt(' or ') || this.lookingAtWord('or')) {
      this.consume(' or ') || this.consumeWord('or');
      const right = this.parseAnd();
      left = {
        type: 'BinaryOperation',
        operator: 'or',
        left,
        right,
      };
    }

    return left;
  }

  private parseAnd(): ExpressionIR {
    let left = this.parseNot();

    while (this.lookingAt(' and ') || this.lookingAtWord('and')) {
      this.consume(' and ') || this.consumeWord('and');
      const right = this.parseNot();
      left = {
        type: 'BinaryOperation',
        operator: 'and',
        left,
        right,
      };
    }

    return left;
  }

  private parseNot(): ExpressionIR {
    if (this.lookingAt('not ') || this.lookingAtWord('not')) {
      this.consume('not ') || this.consumeWord('not');
      this.skipWhitespace();
      const argument = this.parseNot();
      return {
        type: 'UnaryOperation',
        operator: 'not',
        argument,
      };
    }

    return this.parseComparison();
  }

  private parseComparison(): ExpressionIR {
    let left = this.parseIn();

    const operators: Array<{ match: string; op: ComparisonIR['operator'] }> = [
      { match: '==', op: '==' },
      { match: '!=', op: '!=' },
      { match: '<=', op: '<=' },
      { match: '>=', op: '>=' },
      { match: '<', op: '<' },
      { match: '>', op: '>' },
      { match: ' is not ', op: 'is not' },
      { match: ' is ', op: 'is' },
    ];

    for (const { match, op } of operators) {
      if (this.lookingAt(match)) {
        this.consume(match);
        this.skipWhitespace();
        const right = this.parseIn();
        return {
          type: 'Comparison',
          operator: op,
          left,
          right,
        };
      }
    }

    return left;
  }

  private parseIn(): ExpressionIR {
    let left = this.parseAdditive();

    // Skip whitespace that may have been left after parsing left operand
    this.skipWhitespace();

    if (this.lookingAt('not in ') || this.lookingAt('not in[')) {
      this.consume('not in');
      this.skipWhitespace();
      const right = this.parseAdditive();
      return {
        type: 'BinaryOperation',
        operator: 'not in',
        left,
        right,
      };
    }

    if (this.lookingAtWord('in')) {
      this.consumeWord('in');
      this.skipWhitespace();
      const right = this.parseAdditive();
      return {
        type: 'BinaryOperation',
        operator: 'in',
        left,
        right,
      };
    }

    return left;
  }

  private parseAdditive(): ExpressionIR {
    let left = this.parseMultiplicative();

    while (true) {
      this.skipWhitespace();
      if (this.lookingAt('+')) {
        this.consume('+');
        this.skipWhitespace();
        const right = this.parseMultiplicative();
        left = {
          type: 'BinaryOperation',
          operator: '+',
          left,
          right,
        };
      } else if (this.lookingAt('-') && !this.lookingAt('--')) {
        this.consume('-');
        this.skipWhitespace();
        const right = this.parseMultiplicative();
        left = {
          type: 'BinaryOperation',
          operator: '-',
          left,
          right,
        };
      } else if (this.lookingAt('~')) {
        this.consume('~');
        this.skipWhitespace();
        const right = this.parseMultiplicative();
        left = {
          type: 'BinaryOperation',
          operator: '~', // String concatenation in Jinja2
          left,
          right,
        };
      } else {
        break;
      }
    }

    return left;
  }

  private parseMultiplicative(): ExpressionIR {
    let left = this.parseUnary();

    while (true) {
      this.skipWhitespace();
      if (this.lookingAt('*')) {
        this.consume('*');
        this.skipWhitespace();
        const right = this.parseUnary();
        left = {
          type: 'BinaryOperation',
          operator: '*',
          left,
          right,
        };
      } else if (this.lookingAt('/')) {
        this.consume('/');
        this.skipWhitespace();
        const right = this.parseUnary();
        left = {
          type: 'BinaryOperation',
          operator: '/',
          left,
          right,
        };
      } else {
        break;
      }
    }

    return left;
  }

  private parseUnary(): ExpressionIR {
    this.skipWhitespace();

    if (this.lookingAt('-') && !this.lookingAt('--')) {
      this.consume('-');
      const argument = this.parseUnary();
      return {
        type: 'UnaryOperation',
        operator: '-',
        argument,
      };
    }

    return this.parsePrimary();
  }

  private parsePrimary(): ExpressionIR {
    this.skipWhitespace();

    // Parenthesized expression
    if (this.lookingAt('(')) {
      this.consume('(');
      this.skipWhitespace();
      const expr = this.parseExpression();
      this.skipWhitespace();
      this.consume(')');
      return expr;
    }

    // Array literal
    if (this.lookingAt('[')) {
      return this.parseArray();
    }

    // String literal
    if (this.lookingAt('"') || this.lookingAt("'")) {
      return this.parseString();
    }

    // Number literal
    if (this.isDigit(this.peek()) || (this.peek() === '-' && this.isDigit(this.peekNext()))) {
      return this.parseNumber();
    }

    // Boolean/none literals
    if (this.lookingAtWord('true') || this.lookingAtWord('True')) {
      this.consumeWord('true') || this.consumeWord('True');
      return { type: 'Literal', value: true };
    }

    if (this.lookingAtWord('false') || this.lookingAtWord('False')) {
      this.consumeWord('false') || this.consumeWord('False');
      return { type: 'Literal', value: false };
    }

    if (this.lookingAtWord('none') || this.lookingAtWord('None') || this.lookingAtWord('null')) {
      this.consumeWord('none') || this.consumeWord('None') || this.consumeWord('null');
      return { type: 'Literal', value: null };
    }

    // Identifier (possibly with member access)
    return this.parseIdentifierOrMemberAccess();
  }

  private parseArray(): ArrayIR {
    this.consume('[');
    this.skipWhitespace();

    const elements: ExpressionIR[] = [];

    while (!this.lookingAt(']') && this.pos < this.source.length) {
      const element = this.parseExpression();
      elements.push(element);
      this.skipWhitespace();
      if (!this.consume(',')) {
        break;
      }
      this.skipWhitespace();
    }

    this.consume(']');

    return {
      type: 'Array',
      elements,
    };
  }

  private parseString(): LiteralIR {
    const quote = this.advance();
    let value = '';

    while (this.pos < this.source.length && this.peek() !== quote) {
      if (this.peek() === '\\' && this.peekNext() === quote) {
        this.advance();
        value += this.advance();
      } else {
        value += this.advance();
      }
    }

    this.advance(); // Consume closing quote

    return {
      type: 'Literal',
      value,
    };
  }

  private parseNumber(): LiteralIR {
    let numStr = '';

    if (this.peek() === '-') {
      numStr += this.advance();
    }

    while (this.isDigit(this.peek())) {
      numStr += this.advance();
    }

    if (this.peek() === '.') {
      numStr += this.advance();
      while (this.isDigit(this.peek())) {
        numStr += this.advance();
      }
    }

    return {
      type: 'Literal',
      value: parseFloat(numStr),
    };
  }

  private parseIdentifierOrMemberAccess(): ExpressionIR {
    const name = this.parseIdentifierName();
    if (!name) {
      // Return an empty identifier if nothing found
      return { type: 'Identifier', name: '' };
    }

    let expr: ExpressionIR = { type: 'Identifier', name };

    // Handle member access and function calls
    while (true) {
      this.skipWhitespace();

      // Member access with dot
      if (this.lookingAt('.')) {
        this.consume('.');
        const property = this.parseIdentifierName();
        if (property) {
          expr = {
            type: 'MemberAccess',
            object: expr,
            property,
            computed: false,
          };
        }
      }
      // Computed member access with brackets
      else if (this.lookingAt('[')) {
        this.consume('[');
        this.skipWhitespace();
        const propExpr = this.parseExpression();
        this.skipWhitespace();
        this.consume(']');

        // Extract property name if it's a string literal
        let property = '';
        let computed = true;
        if (propExpr.type === 'Literal' && typeof propExpr.value === 'string') {
          property = propExpr.value;
          computed = false;
        }

        expr = {
          type: 'MemberAccess',
          object: expr,
          property: property || (propExpr as IdentifierIR).name || '',
          computed,
        };
      }
      // Function call
      else if (this.lookingAt('(')) {
        this.consume('(');
        this.skipWhitespace();
        const args: ExpressionIR[] = [];

        while (!this.lookingAt(')') && this.pos < this.source.length) {
          const arg = this.parseExpression();
          args.push(arg);
          this.skipWhitespace();
          if (!this.consume(',')) {
            break;
          }
          this.skipWhitespace();
        }

        this.consume(')');

        expr = {
          type: 'Call',
          callee: expr,
          arguments: args,
        };
      } else {
        break;
      }
    }

    return expr;
  }

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  private peek(): string {
    return this.source[this.pos] ?? '';
  }

  private peekNext(): string {
    return this.source[this.pos + 1] ?? '';
  }

  private advance(): string {
    return this.source[this.pos++] ?? '';
  }

  private lookingAt(str: string): boolean {
    return this.source.slice(this.pos, this.pos + str.length) === str;
  }

  private lookingAtIgnoreCase(str: string): boolean {
    return this.source.slice(this.pos, this.pos + str.length).toLowerCase() === str.toLowerCase();
  }

  private lookingAtWord(word: string): boolean {
    if (!this.lookingAt(word)) {
      return false;
    }
    const nextChar = this.source[this.pos + word.length];
    return !nextChar || !this.isIdentifierChar(nextChar);
  }

  private consume(str: string): boolean {
    if (this.lookingAt(str)) {
      this.pos += str.length;
      return true;
    }
    return false;
  }

  private consumeIgnoreCase(str: string): boolean {
    if (this.lookingAtIgnoreCase(str)) {
      this.pos += str.length;
      return true;
    }
    return false;
  }

  private consumeWord(word: string): boolean {
    if (this.lookingAtWord(word)) {
      this.pos += word.length;
      return true;
    }
    return false;
  }

  private skipWhitespace(): void {
    while (this.pos < this.source.length && /\s/.test(this.peek())) {
      this.advance();
    }
  }

  private skipPast(marker: string): void {
    const idx = this.source.indexOf(marker, this.pos);
    if (idx !== -1) {
      this.pos = idx + marker.length;
    }
  }

  private parseIdentifierName(): string | null {
    if (!this.isIdentifierStart(this.peek())) {
      return null;
    }

    let name = '';
    while (this.isIdentifierChar(this.peek())) {
      name += this.advance();
    }

    return name || null;
  }

  private parseTagName(): string | null {
    let name = '';
    while (this.isTagChar(this.peek())) {
      name += this.advance();
    }
    return name || null;
  }

  private parseAttributeName(): string | null {
    if (!this.isAttributeStartChar(this.peek())) {
      return null;
    }

    let name = '';
    while (this.isAttributeChar(this.peek())) {
      name += this.advance();
    }

    return name || null;
  }

  private parseUnquotedValue(): string {
    let value = '';
    while (this.pos < this.source.length && !/[\s>]/.test(this.peek())) {
      value += this.advance();
    }
    return value;
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isIdentifierStart(char: string): boolean {
    return /[a-zA-Z_]/.test(char);
  }

  private isIdentifierChar(char: string): boolean {
    return /[a-zA-Z0-9_]/.test(char);
  }

  private isTagChar(char: string): boolean {
    return /[a-zA-Z0-9-]/.test(char);
  }

  private isAttributeStartChar(char: string): boolean {
    return /[a-zA-Z_:]/.test(char) || char === '@' || char === ':';
  }

  private isAttributeChar(char: string): boolean {
    return /[a-zA-Z0-9_:.-]/.test(char) || char === '@';
  }
}

// Export convenience function
export function analyzeJinja2Template(source: string, options?: AnalyzerOptions): TemplateIR {
  const analyzer = new Jinja2Analyzer(options);
  return analyzer.analyze(source);
}

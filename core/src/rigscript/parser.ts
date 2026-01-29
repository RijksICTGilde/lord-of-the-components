/**
 * Lord of the Components - RigScript Parser
 *
 * Parses RigScript tokens into an AST.
 * Recursive descent parser for the RigScript language.
 */

import type {
  Token,
  TokenType,
  Program,
  Statement,
  Expression,
  LetStatement,
  IfStatement,
  ForStatement,
  RenderStatement,
  Identifier,
  MemberExpression,
  ArrayExpression,
  ObjectExpression,
} from './types.js';

// =============================================================================
// PARSER
// =============================================================================

export class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    // Filter out NEWLINE tokens that aren't significant
    this.tokens = this.filterTokens(tokens);
  }

  private filterTokens(tokens: Token[]): Token[] {
    const result: Token[] = [];
    let lastWasNewline = true;

    for (const token of tokens) {
      if (token.type === 'NEWLINE') {
        if (!lastWasNewline) {
          result.push(token);
          lastWasNewline = true;
        }
      } else {
        result.push(token);
        lastWasNewline = false;
      }
    }

    return result;
  }

  parse(): Program {
    const body: Statement[] = [];

    while (!this.isAtEnd()) {
      this.skipNewlines();
      if (!this.isAtEnd()) {
        body.push(this.parseStatement());
      }
    }

    return { type: 'Program', body };
  }

  // ---------------------------------------------------------------------------
  // Statements
  // ---------------------------------------------------------------------------

  private parseStatement(): Statement {
    if (this.check('LET')) {
      return this.parseLetStatement();
    }

    if (this.check('IF')) {
      return this.parseIfStatement();
    }

    if (this.check('FOR')) {
      return this.parseForStatement();
    }

    if (this.check('IDENTIFIER') && this.peek().value === 'render') {
      return this.parseRenderStatement();
    }

    // Could be assignment (x = ...) or expression statement (func())
    const expr = this.parseExpression();

    if (this.check('ASSIGN')) {
      // Assignment statement
      this.advance(); // =
      const value = this.parseExpression();
      this.consumeNewlineOrEnd();

      if (expr.type !== 'Identifier' && expr.type !== 'MemberExpression') {
        throw this.error('Invalid assignment target');
      }

      return {
        type: 'AssignmentStatement',
        target: expr as Identifier | MemberExpression,
        value,
      };
    }

    this.consumeNewlineOrEnd();
    return { type: 'ExpressionStatement', expression: expr };
  }

  private parseLetStatement(): LetStatement {
    this.advance(); // let
    const name = this.consume('IDENTIFIER', 'Expected variable name').value as string;
    this.consume('ASSIGN', "Expected '=' after variable name");
    const value = this.parseExpression();
    this.consumeNewlineOrEnd();

    return { type: 'LetStatement', name, value };
  }

  private parseIfStatement(): IfStatement {
    this.advance(); // if
    const condition = this.parseExpression();
    this.consume('COLON', "Expected ':' after if condition");
    this.consumeNewline();

    const then = this.parseBlock();
    const elif: { condition: Expression; then: Statement[] }[] = [];
    let elseBlock: Statement[] | null = null;

    while (this.check('ELIF')) {
      this.advance(); // elif
      const elifCondition = this.parseExpression();
      this.consume('COLON', "Expected ':' after elif condition");
      this.consumeNewline();
      const elifThen = this.parseBlock();
      elif.push({ condition: elifCondition, then: elifThen });
    }

    if (this.check('ELSE')) {
      this.advance(); // else
      this.consume('COLON', "Expected ':' after else");
      this.consumeNewline();
      elseBlock = this.parseBlock();
    }

    return { type: 'IfStatement', condition, then, elif, else: elseBlock };
  }

  private parseForStatement(): ForStatement {
    this.advance(); // for

    let variable: string;
    let index: string | undefined;

    const first = this.consume('IDENTIFIER', 'Expected variable name').value as string;

    if (this.check('COMMA')) {
      this.advance(); // ,
      index = first;
      variable = this.consume('IDENTIFIER', 'Expected variable name').value as string;
    } else {
      variable = first;
    }

    this.consume('IN', "Expected 'in' after variable");
    const iterable = this.parseExpression();
    this.consume('COLON', "Expected ':' after for expression");
    this.consumeNewline();

    const body = this.parseBlock();

    return { type: 'ForStatement', variable, index, iterable, body };
  }

  private parseRenderStatement(): RenderStatement {
    this.advance(); // render
    this.consume('DOT', "Expected '.' after render");

    const methodToken = this.consume('IDENTIFIER', 'Expected render method');
    const method = methodToken.value as RenderStatement['method'];

    this.consume('LPAREN', "Expected '(' after render method");
    const args: Expression[] = [];
    const attributes: { [key: string]: Expression } = {};

    // Parse arguments and keyword arguments
    if (!this.check('RPAREN')) {
      do {
        // Check for keyword argument (name=value)
        if (this.check('IDENTIFIER') && this.peekNext()?.type === 'ASSIGN') {
          const key = this.advance().value as string;
          this.advance(); // =
          const value = this.parseExpression();
          attributes[key] = value;
        } else {
          args.push(this.parseExpression());
        }
      } while (this.match('COMMA'));
    }

    this.consume('RPAREN', "Expected ')' after render arguments");

    let children: Statement[] | null = null;

    // Check for block
    if (this.check('COLON')) {
      this.advance(); // :
      this.consumeNewline();
      children = this.parseBlock();
    } else {
      this.consumeNewlineOrEnd();
    }

    return {
      type: 'RenderStatement',
      method,
      args,
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      children,
    };
  }

  private parseBlock(): Statement[] {
    this.consume('INDENT', 'Expected indented block');
    const statements: Statement[] = [];

    while (!this.check('DEDENT') && !this.isAtEnd()) {
      this.skipNewlines();
      if (!this.check('DEDENT') && !this.isAtEnd()) {
        statements.push(this.parseStatement());
      }
    }

    if (this.check('DEDENT')) {
      this.advance();
    }

    return statements;
  }

  // ---------------------------------------------------------------------------
  // Expressions (precedence climbing)
  // ---------------------------------------------------------------------------

  private parseExpression(): Expression {
    return this.parseTernary();
  }

  private parseTernary(): Expression {
    let expr = this.parseOr();

    if (this.check('QUESTION')) {
      this.advance(); // ?
      const consequent = this.parseExpression();
      this.consume('COLON', "Expected ':' in ternary expression");
      const alternate = this.parseExpression();

      expr = {
        type: 'TernaryExpression',
        condition: expr,
        consequent,
        alternate,
      };
    }

    return expr;
  }

  private parseOr(): Expression {
    let left = this.parseAnd();

    while (this.check('OR')) {
      this.advance();
      const right = this.parseAnd();
      left = { type: 'BinaryExpression', operator: 'or', left, right };
    }

    return left;
  }

  private parseAnd(): Expression {
    let left = this.parseEquality();

    while (this.check('AND')) {
      this.advance();
      const right = this.parseEquality();
      left = { type: 'BinaryExpression', operator: 'and', left, right };
    }

    return left;
  }

  private parseEquality(): Expression {
    let left = this.parseComparison();

    while (this.check('EQ') || this.check('NEQ')) {
      const operator = this.advance().type === 'EQ' ? '==' : '!=';
      const right = this.parseComparison();
      left = { type: 'BinaryExpression', operator, left, right };
    }

    return left;
  }

  private parseComparison(): Expression {
    let left = this.parseAdditive();

    while (this.check('LT') || this.check('LTE') || this.check('GT') || this.check('GTE')) {
      const token = this.advance();
      const operator = token.type === 'LT' ? '<' :
                       token.type === 'LTE' ? '<=' :
                       token.type === 'GT' ? '>' : '>=';
      const right = this.parseAdditive();
      left = { type: 'BinaryExpression', operator, left, right };
    }

    return left;
  }

  private parseAdditive(): Expression {
    let left = this.parseMultiplicative();

    while (this.check('PLUS') || this.check('MINUS')) {
      const operator = this.advance().type === 'PLUS' ? '+' : '-';
      const right = this.parseMultiplicative();
      left = { type: 'BinaryExpression', operator, left, right };
    }

    return left;
  }

  private parseMultiplicative(): Expression {
    let left = this.parseUnary();

    while (this.check('STAR') || this.check('SLASH')) {
      const operator = this.advance().type === 'STAR' ? '*' : '/';
      const right = this.parseUnary();
      left = { type: 'BinaryExpression', operator, left, right };
    }

    return left;
  }

  private parseUnary(): Expression {
    if (this.check('NOT')) {
      this.advance();
      const argument = this.parseUnary();
      return { type: 'UnaryExpression', operator: 'not', argument };
    }

    if (this.check('MINUS')) {
      this.advance();
      const argument = this.parseUnary();
      return { type: 'UnaryExpression', operator: '-', argument };
    }

    return this.parsePostfix();
  }

  private parsePostfix(): Expression {
    let expr = this.parsePrimary();

    while (true) {
      if (this.check('DOT')) {
        this.advance();
        const property = this.consume('IDENTIFIER', 'Expected property name');
        expr = {
          type: 'MemberExpression',
          object: expr,
          property: { type: 'Identifier', name: property.value as string },
          computed: false,
        };
      } else if (this.check('LBRACKET')) {
        this.advance();
        const index = this.parseExpression();
        this.consume('RBRACKET', "Expected ']'");
        expr = {
          type: 'MemberExpression',
          object: expr,
          property: index,
          computed: true,
        };
      } else if (this.check('LPAREN')) {
        this.advance();
        const args: Expression[] = [];

        if (!this.check('RPAREN')) {
          do {
            args.push(this.parseExpression());
          } while (this.match('COMMA'));
        }

        this.consume('RPAREN', "Expected ')'");
        expr = { type: 'CallExpression', callee: expr, arguments: args };
      } else {
        break;
      }
    }

    return expr;
  }

  private parsePrimary(): Expression {
    // Literals
    if (this.check('STRING') || this.check('NUMBER') || this.check('BOOLEAN')) {
      const token = this.advance();
      return { type: 'Literal', value: token.value as string | number | boolean };
    }

    // Identifiers
    if (this.check('IDENTIFIER')) {
      const token = this.advance();
      return { type: 'Identifier', name: token.value as string };
    }

    // Parenthesized expression
    if (this.check('LPAREN')) {
      this.advance();
      const expr = this.parseExpression();
      this.consume('RPAREN', "Expected ')'");
      return expr;
    }

    // Array literal
    if (this.check('LBRACKET')) {
      return this.parseArrayLiteral();
    }

    // Object literal
    if (this.check('LBRACE')) {
      return this.parseObjectLiteral();
    }

    throw this.error(`Unexpected token: ${this.peek().type}`);
  }

  private parseArrayLiteral(): ArrayExpression {
    this.advance(); // [
    const elements: Expression[] = [];

    if (!this.check('RBRACKET')) {
      do {
        elements.push(this.parseExpression());
      } while (this.match('COMMA'));
    }

    this.consume('RBRACKET', "Expected ']'");
    return { type: 'ArrayExpression', elements };
  }

  private parseObjectLiteral(): ObjectExpression {
    this.advance(); // {
    const properties: { key: string; value: Expression }[] = [];

    if (!this.check('RBRACE')) {
      do {
        const keyToken = this.consume('IDENTIFIER', 'Expected property key');
        this.consume('COLON', "Expected ':'");
        const value = this.parseExpression();
        properties.push({ key: keyToken.value as string, value });
      } while (this.match('COMMA'));
    }

    this.consume('RBRACE', "Expected '}'");
    return { type: 'ObjectExpression', properties };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private peek(): Token {
    return this.tokens[this.pos] ?? { type: 'EOF', value: '', line: 0, column: 0 };
  }

  private peekNext(): Token | undefined {
    return this.tokens[this.pos + 1];
  }

  private check(type: TokenType): boolean {
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.pos++;
    return this.tokens[this.pos - 1]!;
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw this.error(message);
  }

  private consumeNewline(): void {
    if (this.check('NEWLINE')) {
      this.advance();
    }
  }

  private consumeNewlineOrEnd(): void {
    if (this.check('NEWLINE')) {
      this.advance();
    } else if (!this.isAtEnd() && !this.check('DEDENT') && !this.check('EOF')) {
      // Allow implicit end of statement at end of block
    }
  }

  private skipNewlines(): void {
    while (this.check('NEWLINE')) {
      this.advance();
    }
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private error(message: string): Error {
    const token = this.peek();
    return new Error(`${message} at line ${token.line}, column ${token.column}`);
  }
}

/**
 * Parse RigScript source code into an AST
 */
export function parse(tokens: Token[]): Program {
  const parser = new Parser(tokens);
  return parser.parse();
}

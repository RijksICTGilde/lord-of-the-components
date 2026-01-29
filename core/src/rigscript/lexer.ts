/**
 * Lord of the Components - RigScript Lexer
 *
 * Tokenizes RigScript source code into a stream of tokens.
 * Handles Python-like indentation-based blocks.
 */

import type { Token, TokenType } from './types.js';

// =============================================================================
// KEYWORDS
// =============================================================================

const KEYWORDS: Record<string, TokenType> = {
  'let': 'LET',
  'if': 'IF',
  'elif': 'ELIF',
  'else': 'ELSE',
  'for': 'FOR',
  'in': 'IN',
  'and': 'AND',
  'or': 'OR',
  'not': 'NOT',
  'true': 'TRUE',
  'false': 'FALSE',
};

// =============================================================================
// LEXER
// =============================================================================

export class Lexer {
  private source: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];
  private indentStack: number[] = [0];
  private atLineStart: boolean = true;

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    while (!this.isAtEnd()) {
      this.scanToken();
    }

    // Emit remaining DEDENTs
    while (this.indentStack.length > 1) {
      this.indentStack.pop();
      this.addToken('DEDENT', '');
    }

    this.addToken('EOF', '');
    return this.tokens;
  }

  private scanToken(): void {
    // Handle indentation at line start
    if (this.atLineStart) {
      this.handleIndentation();
      this.atLineStart = false;
    }

    // Skip whitespace (but not newlines)
    while (this.peek() === ' ' || this.peek() === '\t') {
      this.advance();
    }

    // Skip single-line comments (#)
    if (this.peek() === '#') {
      while (this.peek() !== '\n' && !this.isAtEnd()) {
        this.advance();
      }
      return;
    }

    // Skip // comments
    if (this.peek() === '/' && this.peekNext() === '/') {
      while (this.peek() !== '\n' && !this.isAtEnd()) {
        this.advance();
      }
      return;
    }

    // Multi-line comments /* */
    if (this.peek() === '/' && this.peekNext() === '*') {
      this.advance(); // /
      this.advance(); // *
      while (!(this.peek() === '*' && this.peekNext() === '/') && !this.isAtEnd()) {
        if (this.peek() === '\n') {
          this.line++;
          this.column = 1;
        }
        this.advance();
      }
      if (!this.isAtEnd()) {
        this.advance(); // *
        this.advance(); // /
      }
      return;
    }

    if (this.isAtEnd()) return;

    const char = this.peek();

    // Newline
    if (char === '\n') {
      this.addToken('NEWLINE', '\n');
      this.advance();
      this.line++;
      this.column = 1;
      this.atLineStart = true;
      return;
    }

    // Skip carriage return
    if (char === '\r') {
      this.advance();
      return;
    }

    // String literals
    if (char === '"' || char === "'") {
      this.scanString(char);
      return;
    }

    // Numbers
    if (this.isDigit(char)) {
      this.scanNumber();
      return;
    }

    // Identifiers and keywords
    if (this.isAlpha(char)) {
      this.scanIdentifier();
      return;
    }

    // Operators and punctuation
    this.scanOperator();
  }

  private handleIndentation(): void {
    let indent = 0;

    // Count spaces at start of line
    while (this.peek() === ' ') {
      indent++;
      this.advance();
    }

    // Convert tabs to 4 spaces
    while (this.peek() === '\t') {
      indent += 4;
      this.advance();
    }

    // Skip blank lines
    if (this.peek() === '\n' || this.peek() === '\r' || this.isAtEnd()) {
      return;
    }

    // Skip comment-only lines
    if (this.peek() === '#' || (this.peek() === '/' && this.peekNext() === '/')) {
      return;
    }

    const currentIndent = this.indentStack[this.indentStack.length - 1] ?? 0;

    if (indent > currentIndent) {
      this.indentStack.push(indent);
      this.addToken('INDENT', '');
    } else if (indent < currentIndent) {
      while (this.indentStack.length > 1 && (this.indentStack[this.indentStack.length - 1] ?? 0) > indent) {
        this.indentStack.pop();
        this.addToken('DEDENT', '');
      }
    }
  }

  private scanString(quote: string): void {
    const startLine = this.line;
    const startColumn = this.column;
    this.advance(); // Opening quote

    let value = '';
    while (this.peek() !== quote && !this.isAtEnd()) {
      if (this.peek() === '\\') {
        this.advance();
        const escaped = this.peek();
        switch (escaped) {
          case 'n': value += '\n'; break;
          case 't': value += '\t'; break;
          case 'r': value += '\r'; break;
          case '\\': value += '\\'; break;
          case '"': value += '"'; break;
          case "'": value += "'"; break;
          default: value += escaped;
        }
        this.advance();
      } else {
        if (this.peek() === '\n') {
          this.line++;
          this.column = 1;
        }
        value += this.peek();
        this.advance();
      }
    }

    if (this.isAtEnd()) {
      throw new Error(`Unterminated string at line ${startLine}, column ${startColumn}`);
    }

    this.advance(); // Closing quote
    this.tokens.push({
      type: 'STRING',
      value,
      line: startLine,
      column: startColumn,
    });
  }

  private scanNumber(): void {
    const startColumn = this.column;
    let value = '';

    while (this.isDigit(this.peek())) {
      value += this.peek();
      this.advance();
    }

    // Decimal part
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      value += this.peek();
      this.advance();
      while (this.isDigit(this.peek())) {
        value += this.peek();
        this.advance();
      }
    }

    this.tokens.push({
      type: 'NUMBER',
      value: parseFloat(value),
      line: this.line,
      column: startColumn,
    });
  }

  private scanIdentifier(): void {
    const startColumn = this.column;
    let value = '';

    while (this.isAlphaNumeric(this.peek())) {
      value += this.peek();
      this.advance();
    }

    // Check if it's a keyword
    const keyword = KEYWORDS[value];
    if (keyword) {
      if (keyword === 'TRUE') {
        this.tokens.push({ type: 'BOOLEAN', value: true, line: this.line, column: startColumn });
      } else if (keyword === 'FALSE') {
        this.tokens.push({ type: 'BOOLEAN', value: false, line: this.line, column: startColumn });
      } else {
        this.tokens.push({ type: keyword, value, line: this.line, column: startColumn });
      }
    } else {
      this.tokens.push({ type: 'IDENTIFIER', value, line: this.line, column: startColumn });
    }
  }

  private scanOperator(): void {
    const char = this.peek();
    const startColumn = this.column;

    switch (char) {
      case '+': this.addToken('PLUS', '+'); this.advance(); break;
      case '-': this.addToken('MINUS', '-'); this.advance(); break;
      case '*': this.addToken('STAR', '*'); this.advance(); break;
      case '/': this.addToken('SLASH', '/'); this.advance(); break;
      case '.': this.addToken('DOT', '.'); this.advance(); break;
      case ',': this.addToken('COMMA', ','); this.advance(); break;
      case ':': this.addToken('COLON', ':'); this.advance(); break;
      case '?': this.addToken('QUESTION', '?'); this.advance(); break;
      case '(': this.addToken('LPAREN', '('); this.advance(); break;
      case ')': this.addToken('RPAREN', ')'); this.advance(); break;
      case '[': this.addToken('LBRACKET', '['); this.advance(); break;
      case ']': this.addToken('RBRACKET', ']'); this.advance(); break;
      case '{': this.addToken('LBRACE', '{'); this.advance(); break;
      case '}': this.addToken('RBRACE', '}'); this.advance(); break;
      case '=':
        this.advance();
        if (this.peek() === '=') {
          this.addToken('EQ', '==');
          this.advance();
        } else {
          this.addToken('ASSIGN', '=');
        }
        break;
      case '!':
        this.advance();
        if (this.peek() === '=') {
          this.addToken('NEQ', '!=');
          this.advance();
        } else {
          throw new Error(`Unexpected character '!' at line ${this.line}, column ${startColumn}`);
        }
        break;
      case '<':
        this.advance();
        if (this.peek() === '=') {
          this.addToken('LTE', '<=');
          this.advance();
        } else {
          this.addToken('LT', '<');
        }
        break;
      case '>':
        this.advance();
        if (this.peek() === '=') {
          this.addToken('GTE', '>=');
          this.advance();
        } else {
          this.addToken('GT', '>');
        }
        break;
      default:
        throw new Error(`Unexpected character '${char}' at line ${this.line}, column ${this.column}`);
    }
  }

  // Helpers
  private isAtEnd(): boolean {
    return this.pos >= this.source.length;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source[this.pos]!;
  }

  private peekNext(): string {
    if (this.pos + 1 >= this.source.length) return '\0';
    return this.source[this.pos + 1]!;
  }

  private advance(): string {
    const char = this.source[this.pos]!;
    this.pos++;
    this.column++;
    return char;
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') ||
           (char >= 'A' && char <= 'Z') ||
           char === '_';
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private addToken(type: TokenType, value: string | number | boolean): void {
    this.tokens.push({
      type,
      value,
      line: this.line,
      column: this.column,
    });
  }
}

/**
 * Tokenize RigScript source code
 */
export function tokenize(source: string): Token[] {
  const lexer = new Lexer(source);
  return lexer.tokenize();
}

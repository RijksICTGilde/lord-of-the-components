/**
 * Lord of the Components - RigScript AST Types
 *
 * Type definitions for the RigScript abstract syntax tree.
 * RigScript is a Python-like DSL for component template logic.
 */

// =============================================================================
// TOKEN TYPES (Lexer output)
// =============================================================================

export type TokenType =
  // Literals
  | 'STRING'
  | 'NUMBER'
  | 'BOOLEAN'
  | 'IDENTIFIER'
  // Keywords
  | 'LET'
  | 'IF'
  | 'ELIF'
  | 'ELSE'
  | 'FOR'
  | 'IN'
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'TRUE'
  | 'FALSE'
  // Operators
  | 'PLUS'
  | 'MINUS'
  | 'STAR'
  | 'SLASH'
  | 'EQ'
  | 'NEQ'
  | 'LT'
  | 'LTE'
  | 'GT'
  | 'GTE'
  | 'ASSIGN'
  | 'DOT'
  | 'COMMA'
  | 'COLON'
  | 'QUESTION'
  // Brackets
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'LBRACE'
  | 'RBRACE'
  // Structure
  | 'NEWLINE'
  | 'INDENT'
  | 'DEDENT'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string | number | boolean;
  line: number;
  column: number;
}

// =============================================================================
// AST NODE TYPES
// =============================================================================

export type ASTNode =
  | Program
  | Statement
  | Expression;

// -----------------------------------------------------------------------------
// Program (root)
// -----------------------------------------------------------------------------

export interface Program {
  type: 'Program';
  body: Statement[];
}

// -----------------------------------------------------------------------------
// Statements
// -----------------------------------------------------------------------------

export type Statement =
  | LetStatement
  | AssignmentStatement
  | IfStatement
  | ForStatement
  | RenderStatement
  | ExpressionStatement;

export interface LetStatement {
  type: 'LetStatement';
  name: string;
  value: Expression;
}

export interface AssignmentStatement {
  type: 'AssignmentStatement';
  target: MemberExpression | Identifier;
  value: Expression;
}

export interface IfStatement {
  type: 'IfStatement';
  condition: Expression;
  then: Statement[];
  elif: { condition: Expression; then: Statement[] }[];
  else: Statement[] | null;
}

export interface ForStatement {
  type: 'ForStatement';
  variable: string;
  index?: string; // for "index, item in items"
  iterable: Expression;
  body: Statement[];
}

export interface RenderStatement {
  type: 'RenderStatement';
  method: 'element' | 'children' | 'slot' | 'text' | 'html' | 'component' | 'if' | 'for' | 'wrap';
  args: Expression[];
  attributes?: { [key: string]: Expression };
  children: Statement[] | null;
}

export interface ExpressionStatement {
  type: 'ExpressionStatement';
  expression: Expression;
}

// -----------------------------------------------------------------------------
// Expressions
// -----------------------------------------------------------------------------

export type Expression =
  | Literal
  | Identifier
  | BinaryExpression
  | UnaryExpression
  | TernaryExpression
  | CallExpression
  | MemberExpression
  | ArrayExpression
  | ObjectExpression;

export interface Literal {
  type: 'Literal';
  value: string | number | boolean;
}

export interface Identifier {
  type: 'Identifier';
  name: string;
}

export interface BinaryExpression {
  type: 'BinaryExpression';
  operator: '+' | '-' | '*' | '/' | '==' | '!=' | '<' | '<=' | '>' | '>=' | 'and' | 'or';
  left: Expression;
  right: Expression;
}

export interface UnaryExpression {
  type: 'UnaryExpression';
  operator: 'not' | '-';
  argument: Expression;
}

export interface TernaryExpression {
  type: 'TernaryExpression';
  condition: Expression;
  consequent: Expression;
  alternate: Expression;
}

export interface CallExpression {
  type: 'CallExpression';
  callee: Expression;
  arguments: Expression[];
}

export interface MemberExpression {
  type: 'MemberExpression';
  object: Expression;
  property: Expression;
  computed: boolean; // true for obj["key"], false for obj.key
}

export interface ArrayExpression {
  type: 'ArrayExpression';
  elements: Expression[];
}

export interface ObjectExpression {
  type: 'ObjectExpression';
  properties: { key: string; value: Expression }[];
}

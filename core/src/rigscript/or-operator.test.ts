/**
 * Unit tests for RigScript `or` operator
 * Tests lexer, parser, and Jinja2 transpiler support
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Lexer, tokenize } from './lexer.js';
import { Parser, parse } from './parser.js';
import { Jinja2Transpiler, transpileToJinja2 } from './transpiler-jinja2.js';
import type { BinaryExpression, Program, LetStatement } from './types.js';

describe('Lexer: or operator', () => {
  it('should tokenize "or" as OR token', () => {
    const tokens = tokenize('a or b');
    const orToken = tokens.find((t) => t.type === 'OR');
    assert.ok(orToken, 'OR token should exist');
    assert.strictEqual(orToken.value, 'or');
  });

  it('should tokenize "or" in expression context', () => {
    const tokens = tokenize('props.variant or "primary"');
    const types = tokens.map((t) => t.type);
    assert.ok(types.includes('OR'), 'OR token should be present');
    assert.deepStrictEqual(
      types.filter((t) => !['NEWLINE', 'EOF'].includes(t)),
      ['IDENTIFIER', 'DOT', 'IDENTIFIER', 'OR', 'STRING']
    );
  });

  it('should handle multiple or operators', () => {
    const tokens = tokenize('a or b or c');
    const orCount = tokens.filter((t) => t.type === 'OR').length;
    assert.strictEqual(orCount, 2, 'Should have two OR tokens');
  });

  it('should not confuse "or" with identifiers containing "or"', () => {
    const tokens = tokenize('order');
    const types = tokens.filter((t) => !['NEWLINE', 'EOF'].includes(t.type)).map((t) => t.type);
    assert.deepStrictEqual(types, ['IDENTIFIER'], 'Should be single IDENTIFIER token');
    assert.strictEqual(tokens[0]?.value, 'order');
  });
});

describe('Parser: or expression', () => {
  it('should parse simple or expression', () => {
    const tokens = tokenize('let x = a or b');
    const ast = parse(tokens);

    assert.strictEqual(ast.body.length, 1);
    const stmt = ast.body[0] as LetStatement;
    assert.strictEqual(stmt.type, 'LetStatement');
    assert.strictEqual(stmt.name, 'x');

    const expr = stmt.value as BinaryExpression;
    assert.strictEqual(expr.type, 'BinaryExpression');
    assert.strictEqual(expr.operator, 'or');
    assert.deepStrictEqual(expr.left, { type: 'Identifier', name: 'a' });
    assert.deepStrictEqual(expr.right, { type: 'Identifier', name: 'b' });
  });

  it('should parse or with string fallback', () => {
    const tokens = tokenize('let variant = props.variant or "primary"');
    const ast = parse(tokens);

    const stmt = ast.body[0] as LetStatement;
    const expr = stmt.value as BinaryExpression;
    assert.strictEqual(expr.operator, 'or');
    assert.strictEqual(expr.right.type, 'Literal');
    if (expr.right.type === 'Literal') {
      assert.strictEqual(expr.right.value, 'primary');
    }
  });

  it('should handle chained or expressions (left-associative)', () => {
    const tokens = tokenize('let x = a or b or c');
    const ast = parse(tokens);

    const stmt = ast.body[0] as LetStatement;
    const outer = stmt.value as BinaryExpression;
    assert.strictEqual(outer.operator, 'or');

    // Left associative: ((a or b) or c)
    const inner = outer.left as BinaryExpression;
    assert.strictEqual(inner.type, 'BinaryExpression');
    assert.strictEqual(inner.operator, 'or');
    assert.deepStrictEqual(inner.left, { type: 'Identifier', name: 'a' });
    assert.deepStrictEqual(inner.right, { type: 'Identifier', name: 'b' });
    assert.deepStrictEqual(outer.right, { type: 'Identifier', name: 'c' });
  });

  it('should have lower precedence than and', () => {
    const tokens = tokenize('let x = a and b or c');
    const ast = parse(tokens);

    const stmt = ast.body[0] as LetStatement;
    const expr = stmt.value as BinaryExpression;

    // Should be: (a and b) or c
    assert.strictEqual(expr.operator, 'or');
    const left = expr.left as BinaryExpression;
    assert.strictEqual(left.operator, 'and');
  });

  it('should have lower precedence than comparison', () => {
    const tokens = tokenize('let x = a == b or c');
    const ast = parse(tokens);

    const stmt = ast.body[0] as LetStatement;
    const expr = stmt.value as BinaryExpression;

    // Should be: (a == b) or c
    assert.strictEqual(expr.operator, 'or');
    const left = expr.left as BinaryExpression;
    assert.strictEqual(left.operator, '==');
  });
});

describe('Transpiler: or to Jinja2', () => {
  it('should transpile simple or expression', () => {
    const tokens = tokenize('let result = a or b');
    const ast = parse(tokens);
    const output = transpileToJinja2(ast);

    assert.ok(output.includes('(a or b)'), `Output should contain "(a or b)": ${output}`);
  });

  it('should transpile or with props access', () => {
    const tokens = tokenize('let variant = props.variant or "primary"');
    const ast = parse(tokens);
    const output = transpileToJinja2(ast);

    // props maps to ctx
    assert.ok(output.includes('ctx.variant or "primary"'), `Output should contain or expression: ${output}`);
  });

  it('should transpile chained or expressions', () => {
    const tokens = tokenize('let x = a or b or c');
    const ast = parse(tokens);
    const output = transpileToJinja2(ast);

    // Left associative produces ((a or b) or c)
    assert.ok(output.includes('or'), `Output should contain or operator: ${output}`);
  });

  it('should transpile mixed and/or expressions', () => {
    const tokens = tokenize('let x = a and b or c and d');
    const ast = parse(tokens);
    const output = transpileToJinja2(ast);

    // Should produce ((a and b) or (c and d))
    assert.ok(output.includes('and'), `Output should contain and: ${output}`);
    assert.ok(output.includes('or'), `Output should contain or: ${output}`);
  });

  it('should preserve or in conditional context', () => {
    const code = `if props.show or props.force:
    render.text("visible")`;
    const tokens = tokenize(code);
    const ast = parse(tokens);
    const output = transpileToJinja2(ast);

    assert.ok(output.includes('{% if'), `Output should contain if: ${output}`);
    assert.ok(output.includes('or'), `Output should contain or: ${output}`);
  });
});

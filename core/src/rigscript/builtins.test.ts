/**
 * Unit tests for RigScript Builtins
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isBuiltin,
  getBuiltin,
  transformToJinja2,
  transformToReact,
  BUILTINS,
} from './builtins.js';

describe('Builtins Registry', () => {
  it('should have join function registered', () => {
    assert.strictEqual(isBuiltin('join'), true);
    const builtin = getBuiltin('join');
    assert.ok(builtin);
    assert.strictEqual(builtin.name, 'join');
    assert.strictEqual(builtin.minArgs, 2);
    assert.strictEqual(builtin.maxArgs, 2);
  });

  it('should have default function registered', () => {
    assert.strictEqual(isBuiltin('default'), true);
    const builtin = getBuiltin('default');
    assert.ok(builtin);
    assert.strictEqual(builtin.name, 'default');
    assert.strictEqual(builtin.minArgs, 2);
    assert.strictEqual(builtin.maxArgs, 2);
  });

  it('should return false for non-builtin functions', () => {
    assert.strictEqual(isBuiltin('customFunc'), false);
    assert.strictEqual(getBuiltin('customFunc'), undefined);
  });
});

describe('Jinja2 Builtins', () => {
  describe('join()', () => {
    it('should transform join(array, separator) to array | join(separator)', () => {
      const result = transformToJinja2('join', ['classes', '" "']);
      assert.strictEqual(result, 'classes | join(" ")');
    });

    it('should handle complex array expressions', () => {
      const result = transformToJinja2('join', ['items | map(attribute="name")', '", "']);
      assert.strictEqual(result, 'items | map(attribute="name") | join(", ")');
    });
  });

  describe('default()', () => {
    it('should transform default(value, fallback) to value | default(fallback)', () => {
      const result = transformToJinja2('default', ['ctx.variant', '"primary"']);
      assert.strictEqual(result, 'ctx.variant | default("primary")');
    });

    it('should handle nested property access', () => {
      const result = transformToJinja2('default', ['ctx.config.theme', '"light"']);
      assert.strictEqual(result, 'ctx.config.theme | default("light")');
    });
  });

  it('should return null for non-builtin functions', () => {
    const result = transformToJinja2('customFunc', ['arg1', 'arg2']);
    assert.strictEqual(result, null);
  });
});

describe('React Builtins', () => {
  describe('join()', () => {
    it('should transform join(array, separator) to array.join(separator)', () => {
      const result = transformToReact('join', ['classes', '" "']);
      assert.strictEqual(result, 'classes.join(" ")');
    });
  });

  describe('default()', () => {
    it('should transform default(value, fallback) to (value ?? fallback)', () => {
      const result = transformToReact('default', ['props.variant', '"primary"']);
      assert.strictEqual(result, '(props.variant ?? "primary")');
    });
  });

  it('should return null for non-builtin functions', () => {
    const result = transformToReact('customFunc', ['arg1', 'arg2']);
    assert.strictEqual(result, null);
  });
});

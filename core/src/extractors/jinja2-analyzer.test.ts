/**
 * Unit tests for Jinja2 Template Analyzer
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  Jinja2Analyzer,
  analyzeJinja2Template,
  type TemplateIR,
  type ElementIR,
  type ConditionalIR,
  type LoopIR,
  type ExpressionOutputIR,
  type VariableDeclarationIR,
} from './jinja2-analyzer.js';

describe('Jinja2Analyzer', () => {
  describe('Template Comments', () => {
    it('should extract template comment at the beginning', () => {
      const source = `{#
  Button Component
  For user actions
#}
<button>Click</button>`;

      const result = analyzeJinja2Template(source);

      assert.strictEqual(result.type, 'Template');
      assert.ok(result.comment);
      assert.ok(result.comment.includes('Button Component'));
    });

    it('should handle template without comment', () => {
      const source = '<button>Click</button>';

      const result = analyzeJinja2Template(source);

      assert.strictEqual(result.comment, undefined);
    });
  });

  describe('Variable Declarations', () => {
    it('should parse simple set statements', () => {
      const source = `{% set variant = ctx.variant %}
<div></div>`;

      const result = analyzeJinja2Template(source);

      assert.strictEqual(result.variables.length, 1);
      assert.strictEqual(result.variables[0].name, 'variant');
      assert.strictEqual(result.variables[0].value.type, 'MemberAccess');
    });

    it('should parse set with default filter', () => {
      const source = `{% set variant = ctx.variant | default('primary') %}
<div></div>`;

      const result = analyzeJinja2Template(source);

      assert.strictEqual(result.variables.length, 1);
      assert.strictEqual(result.variables[0].name, 'variant');
      assert.strictEqual(result.variables[0].value.type, 'FilteredExpression');
    });

    it('should skip context assignment', () => {
      const source = `{% set ctx = _component_context %}
{% set variant = "primary" %}
<div></div>`;

      const result = analyzeJinja2Template(source);

      assert.strictEqual(result.variables.length, 1);
      assert.strictEqual(result.variables[0].name, 'variant');
    });

    it('should parse array concatenation in set', () => {
      const source = `{% set classes = ['c-button'] + ['c-button--primary'] %}
<div></div>`;

      const result = analyzeJinja2Template(source);

      assert.strictEqual(result.variables.length, 1);
      assert.strictEqual(result.variables[0].value.type, 'BinaryOperation');
      const binary = result.variables[0].value as any;
      assert.strictEqual(binary.operator, '+');
    });
  });

  describe('HTML Elements', () => {
    it('should parse simple element', () => {
      const source = '<button>Click</button>';

      const result = analyzeJinja2Template(source);

      assert.strictEqual(result.body.length, 1);
      const element = result.body[0] as ElementIR;
      assert.strictEqual(element.type, 'Element');
      assert.strictEqual(element.tag, 'button');
    });

    it('should parse nested elements', () => {
      const source = '<div><span>Text</span></div>';

      const result = analyzeJinja2Template(source);

      const element = result.body[0] as ElementIR;
      assert.strictEqual(element.tag, 'div');
      assert.strictEqual(element.children.length, 1);
      const child = element.children[0] as ElementIR;
      assert.strictEqual(child.tag, 'span');
    });

    it('should parse self-closing elements', () => {
      const source = '<input type="text" />';

      const result = analyzeJinja2Template(source);

      const element = result.body[0] as ElementIR;
      assert.strictEqual(element.tag, 'input');
      assert.strictEqual(element.selfClosing, true);
    });

    it('should parse void elements', () => {
      const source = '<br><hr>';

      const result = analyzeJinja2Template(source);

      assert.strictEqual(result.body.length, 2);
      assert.strictEqual((result.body[0] as ElementIR).tag, 'br');
      assert.strictEqual((result.body[1] as ElementIR).tag, 'hr');
    });
  });

  describe('Attributes', () => {
    it('should parse static attributes', () => {
      const source = '<button type="submit" class="btn">Click</button>';

      const result = analyzeJinja2Template(source);

      const element = result.body[0] as ElementIR;
      assert.strictEqual(element.attributes.length, 2);
      assert.strictEqual(element.attributes[0].name, 'type');
      assert.strictEqual(element.attributes[0].value.type, 'static');
      assert.strictEqual((element.attributes[0].value as any).value, 'submit');
    });

    it('should parse dynamic attributes', () => {
      const source = '<button type="{{ btn_type }}">Click</button>';

      const result = analyzeJinja2Template(source);

      const element = result.body[0] as ElementIR;
      assert.strictEqual(element.attributes[0].value.type, 'dynamic');
    });

    it('should parse mixed attributes', () => {
      const source = '<div class="c-button--{{ variant }}">Content</div>';

      const result = analyzeJinja2Template(source);

      const element = result.body[0] as ElementIR;
      assert.strictEqual(element.attributes[0].value.type, 'mixed');
    });

    it('should parse boolean attributes', () => {
      const source = '<button disabled>Click</button>';

      const result = analyzeJinja2Template(source);

      const element = result.body[0] as ElementIR;
      const disabled = element.attributes.find(a => a.name === 'disabled');
      assert.ok(disabled);
    });

    it('should parse conditional attributes', () => {
      const source = '<button {% if disabled %}disabled{% endif %}>Click</button>';

      const result = analyzeJinja2Template(source);

      const element = result.body[0] as ElementIR;
      const disabled = element.attributes.find(a => a.name === 'disabled');
      assert.ok(disabled);
      assert.ok(disabled.conditional);
    });

    it('should parse attribute with filter', () => {
      const source = '<div class="{{ classes | join(\' \') }}"></div>';

      const result = analyzeJinja2Template(source);

      const element = result.body[0] as ElementIR;
      assert.strictEqual(element.attributes[0].value.type, 'dynamic');
    });
  });

  describe('Conditionals', () => {
    it('should parse simple if statement', () => {
      const source = '{% if active %}<span>Active</span>{% endif %}';

      const result = analyzeJinja2Template(source);

      assert.strictEqual(result.body.length, 1);
      const conditional = result.body[0] as ConditionalIR;
      assert.strictEqual(conditional.type, 'Conditional');
      assert.strictEqual(conditional.then.length, 1);
    });

    it('should parse if-else statement', () => {
      const source = '{% if active %}<span>Active</span>{% else %}<span>Inactive</span>{% endif %}';

      const result = analyzeJinja2Template(source);

      const conditional = result.body[0] as ConditionalIR;
      assert.ok(conditional.else);
      assert.strictEqual(conditional.else.length, 1);
    });

    it('should parse if-elif-else statement', () => {
      const source = `{% if status == 'active' %}
<span>Active</span>
{% elif status == 'pending' %}
<span>Pending</span>
{% else %}
<span>Unknown</span>
{% endif %}`;

      const result = analyzeJinja2Template(source);

      const conditional = result.body[0] as ConditionalIR;
      assert.strictEqual(conditional.elif.length, 1);
      assert.ok(conditional.else);
    });

    it('should parse compound conditions', () => {
      const source = '{% if icon and icon_position == "before" %}<span>Icon</span>{% endif %}';

      const result = analyzeJinja2Template(source);

      const conditional = result.body[0] as ConditionalIR;
      assert.strictEqual(conditional.condition.type, 'BinaryOperation');
      const cond = conditional.condition as any;
      assert.strictEqual(cond.operator, 'and');
    });

    it('should parse not condition', () => {
      const source = '{% if not loading %}<span>Loaded</span>{% endif %}';

      const result = analyzeJinja2Template(source);

      const conditional = result.body[0] as ConditionalIR;
      assert.strictEqual(conditional.condition.type, 'UnaryOperation');
      const cond = conditional.condition as any;
      assert.strictEqual(cond.operator, 'not');
    });

    it('should parse in condition', () => {
      const source = '{% if variant in items %}<span>Valid</span>{% endif %}';

      const result = analyzeJinja2Template(source);

      const conditional = result.body[0] as ConditionalIR;
      assert.strictEqual(conditional.condition.type, 'BinaryOperation');
      const cond = conditional.condition as any;
      assert.strictEqual(cond.operator, 'in');
    });

    it('should parse in condition with array literal', () => {
      const source = '{% if variant in ["primary", "secondary"] %}<span>Valid</span>{% endif %}';

      const result = analyzeJinja2Template(source);

      const conditional = result.body[0] as ConditionalIR;
      assert.strictEqual(conditional.condition.type, 'BinaryOperation');
      const cond = conditional.condition as any;
      assert.strictEqual(cond.operator, 'in');
    });
  });

  describe('Loops', () => {
    it('should parse simple for loop', () => {
      const source = '{% for item in items %}<li>{{ item }}</li>{% endfor %}';

      const result = analyzeJinja2Template(source);

      assert.strictEqual(result.body.length, 1);
      const loop = result.body[0] as LoopIR;
      assert.strictEqual(loop.type, 'Loop');
      assert.strictEqual(loop.variable, 'item');
      assert.strictEqual((loop.iterable as any).name, 'items');
    });

    it('should parse loop with member access iterable', () => {
      const source = '{% for item in ctx.items %}<li>{{ item }}</li>{% endfor %}';

      const result = analyzeJinja2Template(source);

      const loop = result.body[0] as LoopIR;
      assert.strictEqual(loop.iterable.type, 'MemberAccess');
    });
  });

  describe('Expression Output', () => {
    it('should parse simple variable output', () => {
      const source = '<span>{{ name }}</span>';

      const result = analyzeJinja2Template(source);

      const element = result.body[0] as ElementIR;
      const output = element.children[0] as ExpressionOutputIR;
      assert.strictEqual(output.type, 'ExpressionOutput');
      assert.strictEqual((output.expression as any).name, 'name');
    });

    it('should parse member access output', () => {
      const source = '<span>{{ ctx.name }}</span>';

      const result = analyzeJinja2Template(source);

      const element = result.body[0] as ElementIR;
      const output = element.children[0] as ExpressionOutputIR;
      assert.strictEqual(output.expression.type, 'MemberAccess');
    });

    it('should parse output with filter', () => {
      const source = '<span>{{ content | safe }}</span>';

      const result = analyzeJinja2Template(source);

      const element = result.body[0] as ElementIR;
      const output = element.children[0] as ExpressionOutputIR;
      assert.strictEqual(output.filters.length, 1);
      assert.strictEqual(output.filters[0].name, 'safe');
    });

    it('should parse output with multiple filters', () => {
      const source = '<span>{{ content | trim | safe }}</span>';

      const result = analyzeJinja2Template(source);

      const element = result.body[0] as ElementIR;
      const output = element.children[0] as ExpressionOutputIR;
      assert.strictEqual(output.filters.length, 2);
    });

    it('should parse output with filter with arguments', () => {
      const source = '<span>{{ items | join(", ") }}</span>';

      const result = analyzeJinja2Template(source);

      const element = result.body[0] as ElementIR;
      const output = element.children[0] as ExpressionOutputIR;
      assert.strictEqual(output.filters[0].name, 'join');
      assert.strictEqual(output.filters[0].arguments.length, 1);
    });
  });

  describe('Expressions', () => {
    it('should parse string literals', () => {
      const source = '{% set name = "test" %}';

      const result = analyzeJinja2Template(source);

      assert.strictEqual(result.variables[0].value.type, 'Literal');
      assert.strictEqual((result.variables[0].value as any).value, 'test');
    });

    it('should parse number literals', () => {
      const source = '{% set count = 42 %}';

      const result = analyzeJinja2Template(source);

      assert.strictEqual(result.variables[0].value.type, 'Literal');
      assert.strictEqual((result.variables[0].value as any).value, 42);
    });

    it('should parse boolean literals', () => {
      const source = '{% set active = true %}';

      const result = analyzeJinja2Template(source);

      assert.strictEqual(result.variables[0].value.type, 'Literal');
      assert.strictEqual((result.variables[0].value as any).value, true);
    });

    it('should parse array literals', () => {
      const source = '{% set items = ["a", "b", "c"] %}';

      const result = analyzeJinja2Template(source);

      assert.strictEqual(result.variables[0].value.type, 'Array');
      const arr = result.variables[0].value as any;
      assert.strictEqual(arr.elements.length, 3);
    });

    it('should parse string concatenation', () => {
      const source = '{% set full = "hello" ~ " " ~ "world" %}';

      const result = analyzeJinja2Template(source);

      assert.strictEqual(result.variables[0].value.type, 'BinaryOperation');
      const concat = result.variables[0].value as any;
      assert.strictEqual(concat.operator, '~');
    });

    it('should parse comparison operators', () => {
      const tests = [
        { source: '{% if a == b %}{% endif %}', op: '==' },
        { source: '{% if a != b %}{% endif %}', op: '!=' },
        { source: '{% if a < b %}{% endif %}', op: '<' },
        { source: '{% if a <= b %}{% endif %}', op: '<=' },
        { source: '{% if a > b %}{% endif %}', op: '>' },
        { source: '{% if a >= b %}{% endif %}', op: '>=' },
      ];

      for (const test of tests) {
        const result = analyzeJinja2Template(test.source);
        const conditional = result.body[0] as ConditionalIR;
        assert.strictEqual(conditional.condition.type, 'Comparison');
        assert.strictEqual((conditional.condition as any).operator, test.op);
      }
    });

    it('should parse or expression', () => {
      const source = '{% set value = a or b %}';

      const result = analyzeJinja2Template(source);

      assert.strictEqual(result.variables[0].value.type, 'BinaryOperation');
      const binary = result.variables[0].value as any;
      assert.strictEqual(binary.operator, 'or');
    });
  });

  describe('Comments', () => {
    it('should parse inline Jinja2 comments', () => {
      const source = '<div>{# This is a comment #}</div>';

      const result = analyzeJinja2Template(source);

      const element = result.body[0] as ElementIR;
      assert.strictEqual(element.type, 'Element');
      // Comment should be parsed as a child
      const comment = element.children.find(c => c.type === 'Comment');
      assert.ok(comment);
    });

    it('should extract leading template comment', () => {
      const source = '{# Template comment #}<div></div>';

      const result = analyzeJinja2Template(source);

      // Leading comment becomes the template comment
      assert.strictEqual(result.comment, 'Template comment');
      // The div should be in the body
      assert.strictEqual(result.body.length, 1);
      assert.strictEqual((result.body[0] as ElementIR).tag, 'div');
    });
  });

  describe('Real Template', () => {
    it('should parse button template structure', () => {
      const source = `{#
  Button Component
#}
{% set ctx = _component_context %}
{% set variant = ctx.variant | default('primary') %}
{% set disabled = ctx.disabled | default(false) %}
{% set classes = ['c-button'] %}
{% set classes = classes + ['c-button--' ~ variant] %}

<button
    type="button"
    class="{{ classes | join(' ') }}"
    {% if disabled %}disabled{% endif %}
>
    {{ ctx.content | safe }}
</button>`;

      const result = analyzeJinja2Template(source);

      // Should have comment
      assert.ok(result.comment);

      // Should have variables
      assert.ok(result.variables.length >= 3);

      // Should have button element
      assert.strictEqual(result.body.length, 1);
      const button = result.body[0] as ElementIR;
      assert.strictEqual(button.type, 'Element');
      assert.strictEqual(button.tag, 'button');

      // Should have attributes
      assert.ok(button.attributes.length >= 2);

      // Should have conditional disabled attribute
      const disabled = button.attributes.find(a => a.name === 'disabled');
      assert.ok(disabled);
      assert.ok(disabled.conditional);
    });
  });
});

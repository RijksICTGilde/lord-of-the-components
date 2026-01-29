/**
 * Unit tests for RigScript Generator
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  RigScriptGenerator,
  generateRigScript,
  jinja2ToRigScript,
} from './rigscript-generator.js';
import { analyzeJinja2Template, type TemplateIR } from './jinja2-analyzer.js';

describe('RigScriptGenerator', () => {
  describe('Basic Generation', () => {
    it('should generate header comment', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [],
        body: [],
      };

      const result = generateRigScript(ir, { componentName: 'Button' });

      assert.ok(result.includes('# Lord of the Components - Button Logic'));
    });

    it('should include template comment in header', () => {
      const ir: TemplateIR = {
        type: 'Template',
        comment: 'Renders an interactive button',
        variables: [],
        body: [],
      };

      const result = generateRigScript(ir);

      assert.ok(result.includes('# Renders an interactive button'));
    });
  });

  describe('Variable Declarations', () => {
    it('should generate let statement from simple variable', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [{
          type: 'VariableDeclaration',
          name: 'variant',
          value: { type: 'Literal', value: 'primary' },
        }],
        body: [],
      };

      const result = generateRigScript(ir);

      assert.ok(result.includes('let variant = "primary"'));
    });

    it('should generate let statement with member access', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [{
          type: 'VariableDeclaration',
          name: 'variant',
          value: {
            type: 'MemberAccess',
            object: { type: 'Identifier', name: 'ctx' },
            property: 'variant',
            computed: false,
          },
        }],
        body: [],
      };

      const result = generateRigScript(ir, { mapCtxToProps: true });

      assert.ok(result.includes('let variant = props.variant'));
    });

    it('should generate let statement with default filter', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [{
          type: 'VariableDeclaration',
          name: 'variant',
          value: {
            type: 'FilteredExpression',
            expression: {
              type: 'MemberAccess',
              object: { type: 'Identifier', name: 'ctx' },
              property: 'variant',
              computed: false,
            },
            filters: [{ name: 'default', arguments: [{ type: 'Literal', value: 'primary' }] }],
          },
        }],
        body: [],
      };

      const result = generateRigScript(ir, { mapCtxToProps: true });

      assert.ok(result.includes('let variant = default(props.variant, "primary")'));
    });
  });

  describe('Element Generation', () => {
    it('should generate render.element call', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [],
        body: [{
          type: 'Element',
          tag: 'button',
          attributes: [],
          children: [],
          selfClosing: false,
        }],
      };

      const result = generateRigScript(ir);

      assert.ok(result.includes('render.element("button"):'));
      assert.ok(result.includes('pass'));
    });

    it('should generate element with static attributes', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [],
        body: [{
          type: 'Element',
          tag: 'button',
          attributes: [
            { name: 'type', value: { type: 'static', value: 'submit' } },
            { name: 'class', value: { type: 'static', value: 'btn' } },
          ],
          children: [],
          selfClosing: false,
        }],
      };

      const result = generateRigScript(ir);

      assert.ok(result.includes('attrs.type = "submit"'));
      assert.ok(result.includes('attrs.class = "btn"'));
    });

    it('should generate element with dynamic attributes', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [],
        body: [{
          type: 'Element',
          tag: 'button',
          attributes: [{
            name: 'class',
            value: {
              type: 'dynamic',
              expression: { type: 'Identifier', name: 'classes' },
            },
          }],
          children: [],
          selfClosing: false,
        }],
      };

      const result = generateRigScript(ir);

      assert.ok(result.includes('attrs.class = classes'));
    });

    it('should generate element with mixed attribute values', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [],
        body: [{
          type: 'Element',
          tag: 'div',
          attributes: [{
            name: 'class',
            value: {
              type: 'mixed',
              parts: [
                { type: 'static', value: 'c-button--' },
                { type: 'dynamic', value: { type: 'Identifier', name: 'variant' } },
              ],
            },
          }],
          children: [],
          selfClosing: false,
        }],
      };

      const result = generateRigScript(ir);

      assert.ok(result.includes('attrs.class = "c-button--" + variant'));
    });

    it('should handle attribute names with hyphens', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [],
        body: [{
          type: 'Element',
          tag: 'button',
          attributes: [{
            name: 'aria-label',
            value: { type: 'static', value: 'Close' },
          }],
          children: [],
          selfClosing: false,
        }],
      };

      const result = generateRigScript(ir);

      assert.ok(result.includes('attrs["aria-label"] = "Close"'));
    });

    it('should generate conditional attributes', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [],
        body: [{
          type: 'Element',
          tag: 'button',
          attributes: [{
            name: 'disabled',
            value: { type: 'static', value: 'true' },
            conditional: { type: 'Identifier', name: 'disabled' },
          }],
          children: [],
          selfClosing: false,
        }],
      };

      const result = generateRigScript(ir);

      assert.ok(result.includes('if disabled:'));
      assert.ok(result.includes('attrs.disabled = true'));
    });
  });

  describe('Text and Output Generation', () => {
    it('should generate render.text for text content', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [],
        body: [{
          type: 'Element',
          tag: 'span',
          attributes: [],
          children: [{
            type: 'Text',
            value: 'Hello World',
          }],
          selfClosing: false,
        }],
      };

      const result = generateRigScript(ir);

      assert.ok(result.includes('render.text("Hello World")'));
    });

    it('should generate render.text for expression output', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [],
        body: [{
          type: 'Element',
          tag: 'span',
          attributes: [],
          children: [{
            type: 'ExpressionOutput',
            expression: { type: 'Identifier', name: 'name' },
            filters: [],
          }],
          selfClosing: false,
        }],
      };

      const result = generateRigScript(ir);

      assert.ok(result.includes('render.text(name)'));
    });

    it('should generate render.slot for content|safe pattern', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [],
        body: [{
          type: 'Element',
          tag: 'div',
          attributes: [],
          children: [{
            type: 'ExpressionOutput',
            expression: { type: 'Identifier', name: 'content' },
            filters: [{ name: 'safe', arguments: [] }],
          }],
          selfClosing: false,
        }],
      };

      const result = generateRigScript(ir);

      assert.ok(result.includes('render.slot("default")'));
    });

    it('should generate render.html for safe filter on other expressions', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [],
        body: [{
          type: 'Element',
          tag: 'div',
          attributes: [],
          children: [{
            type: 'ExpressionOutput',
            expression: { type: 'Identifier', name: 'rawHtml' },
            filters: [{ name: 'safe', arguments: [] }],
          }],
          selfClosing: false,
        }],
      };

      const result = generateRigScript(ir, { mapContentToSlot: false });

      assert.ok(result.includes('render.html(rawHtml)'));
    });
  });

  describe('Conditional Generation', () => {
    it('should generate if statement', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [],
        body: [{
          type: 'Conditional',
          condition: { type: 'Identifier', name: 'active' },
          then: [{
            type: 'Element',
            tag: 'span',
            attributes: [],
            children: [],
            selfClosing: false,
          }],
          elif: [],
          else: null,
        }],
      };

      const result = generateRigScript(ir);

      assert.ok(result.includes('if active:'));
      assert.ok(result.includes('render.element("span")'));
    });

    it('should generate if-else statement', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [],
        body: [{
          type: 'Conditional',
          condition: { type: 'Identifier', name: 'active' },
          then: [{
            type: 'Text',
            value: 'Active',
          }],
          elif: [],
          else: [{
            type: 'Text',
            value: 'Inactive',
          }],
        }],
      };

      const result = generateRigScript(ir);

      assert.ok(result.includes('if active:'));
      assert.ok(result.includes('else:'));
      assert.ok(result.includes('render.text("Active")'));
      assert.ok(result.includes('render.text("Inactive")'));
    });

    it('should generate if-elif-else statement', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [],
        body: [{
          type: 'Conditional',
          condition: {
            type: 'Comparison',
            operator: '==',
            left: { type: 'Identifier', name: 'status' },
            right: { type: 'Literal', value: 'active' },
          },
          then: [{ type: 'Text', value: 'Active' }],
          elif: [{
            condition: {
              type: 'Comparison',
              operator: '==',
              left: { type: 'Identifier', name: 'status' },
              right: { type: 'Literal', value: 'pending' },
            },
            then: [{ type: 'Text', value: 'Pending' }],
          }],
          else: [{ type: 'Text', value: 'Unknown' }],
        }],
      };

      const result = generateRigScript(ir);

      assert.ok(result.includes('if status == "active":'));
      assert.ok(result.includes('elif status == "pending":'));
      assert.ok(result.includes('else:'));
    });

    it('should generate compound conditions', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [],
        body: [{
          type: 'Conditional',
          condition: {
            type: 'BinaryOperation',
            operator: 'and',
            left: { type: 'Identifier', name: 'icon' },
            right: {
              type: 'Comparison',
              operator: '==',
              left: { type: 'Identifier', name: 'position' },
              right: { type: 'Literal', value: 'before' },
            },
          },
          then: [{ type: 'Text', value: 'Icon' }],
          elif: [],
          else: null,
        }],
      };

      const result = generateRigScript(ir);

      assert.ok(result.includes('if icon and position == "before":'));
    });
  });

  describe('Loop Generation', () => {
    it('should generate for loop', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [],
        body: [{
          type: 'Loop',
          variable: 'item',
          iterable: { type: 'Identifier', name: 'items' },
          body: [{
            type: 'Element',
            tag: 'li',
            attributes: [],
            children: [{
              type: 'ExpressionOutput',
              expression: { type: 'Identifier', name: 'item' },
              filters: [],
            }],
            selfClosing: false,
          }],
        }],
      };

      const result = generateRigScript(ir);

      assert.ok(result.includes('for item in items:'));
      assert.ok(result.includes('render.element("li")'));
    });

    it('should generate loop with index', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [],
        body: [{
          type: 'Loop',
          variable: 'item',
          index: 'i',
          iterable: { type: 'Identifier', name: 'items' },
          body: [{ type: 'Text', value: 'Item' }],
        }],
      };

      const result = generateRigScript(ir);

      assert.ok(result.includes('for i, item in items:'));
    });
  });

  describe('Comment Generation', () => {
    it('should include comments when enabled', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [],
        body: [{
          type: 'Comment',
          value: 'This is a comment',
        }],
      };

      const result = generateRigScript(ir, { includeComments: true });

      assert.ok(result.includes('# This is a comment'));
    });

    it('should exclude comments when disabled', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [],
        body: [{
          type: 'Comment',
          value: 'This is a comment',
        }],
      };

      const result = generateRigScript(ir, { includeComments: false });

      assert.ok(!result.includes('# This is a comment'));
    });
  });

  describe('Filter Mappings', () => {
    it('should map join filter to builtin', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [{
          type: 'VariableDeclaration',
          name: 'classes_str',
          value: {
            type: 'FilteredExpression',
            expression: { type: 'Identifier', name: 'classes' },
            filters: [{ name: 'join', arguments: [{ type: 'Literal', value: ' ' }] }],
          },
        }],
        body: [],
      };

      const result = generateRigScript(ir);

      assert.ok(result.includes('let classes_str = join(classes, " ")'));
    });

    it('should map trim filter to builtin', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [{
          type: 'VariableDeclaration',
          name: 'trimmed',
          value: {
            type: 'FilteredExpression',
            expression: { type: 'Identifier', name: 'text' },
            filters: [{ name: 'trim', arguments: [] }],
          },
        }],
        body: [],
      };

      const result = generateRigScript(ir);

      assert.ok(result.includes('let trimmed = trim(text)'));
    });
  });

  describe('Expression Generation', () => {
    it('should generate array literals', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [{
          type: 'VariableDeclaration',
          name: 'items',
          value: {
            type: 'Array',
            elements: [
              { type: 'Literal', value: 'a' },
              { type: 'Literal', value: 'b' },
            ],
          },
        }],
        body: [],
      };

      const result = generateRigScript(ir);

      assert.ok(result.includes('let items = ["a", "b"]'));
    });

    it('should generate binary operations', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [{
          type: 'VariableDeclaration',
          name: 'sum',
          value: {
            type: 'BinaryOperation',
            operator: '+',
            left: { type: 'Identifier', name: 'a' },
            right: { type: 'Identifier', name: 'b' },
          },
        }],
        body: [],
      };

      const result = generateRigScript(ir);

      assert.ok(result.includes('let sum = a + b'));
    });

    it('should map Jinja2 ~ to + for string concatenation', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [{
          type: 'VariableDeclaration',
          name: 'full',
          value: {
            type: 'BinaryOperation',
            operator: '~',
            left: { type: 'Literal', value: 'hello ' },
            right: { type: 'Identifier', name: 'name' },
          },
        }],
        body: [],
      };

      const result = generateRigScript(ir);

      assert.ok(result.includes('let full = "hello " + name'));
    });

    it('should generate or expressions', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [{
          type: 'VariableDeclaration',
          name: 'value',
          value: {
            type: 'BinaryOperation',
            operator: 'or',
            left: { type: 'Identifier', name: 'a' },
            right: { type: 'Identifier', name: 'b' },
          },
        }],
        body: [],
      };

      const result = generateRigScript(ir);

      assert.ok(result.includes('let value = a or b'));
    });

    it('should generate not expressions', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [],
        body: [{
          type: 'Conditional',
          condition: {
            type: 'UnaryOperation',
            operator: 'not',
            argument: { type: 'Identifier', name: 'loading' },
          },
          then: [{ type: 'Text', value: 'Loaded' }],
          elif: [],
          else: null,
        }],
      };

      const result = generateRigScript(ir);

      assert.ok(result.includes('if not loading:'));
    });
  });

  describe('Indentation', () => {
    it('should use 4 spaces by default', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [],
        body: [{
          type: 'Element',
          tag: 'div',
          attributes: [{
            name: 'class',
            value: { type: 'static', value: 'container' },
          }],
          children: [],
          selfClosing: false,
        }],
      };

      const result = generateRigScript(ir);
      const lines = result.split('\n');
      const attrLine = lines.find(l => l.includes('attrs.class'));

      assert.ok(attrLine);
      assert.ok(attrLine.startsWith('    ')); // 4 spaces
    });

    it('should use custom indent string', () => {
      const ir: TemplateIR = {
        type: 'Template',
        variables: [],
        body: [{
          type: 'Element',
          tag: 'div',
          attributes: [{
            name: 'class',
            value: { type: 'static', value: 'container' },
          }],
          children: [],
          selfClosing: false,
        }],
      };

      const result = generateRigScript(ir, { indent: '\t' });
      const lines = result.split('\n');
      const attrLine = lines.find(l => l.includes('attrs.class'));

      assert.ok(attrLine);
      assert.ok(attrLine.startsWith('\t'));
    });
  });

  describe('jinja2ToRigScript Convenience Function', () => {
    it('should convert simple Jinja2 to RigScript', () => {
      const source = '<button type="submit">Click</button>';

      const result = jinja2ToRigScript(source, { componentName: 'Button' });

      assert.ok(result.includes('render.element("button")'));
      assert.ok(result.includes('attrs.type = "submit"'));
      assert.ok(result.includes('render.text("Click")'));
    });

    it('should convert Jinja2 with variables to RigScript', () => {
      const source = `{% set variant = ctx.variant | default('primary') %}
<button class="{{ variant }}">Click</button>`;

      const result = jinja2ToRigScript(source, { componentName: 'Button' });

      assert.ok(result.includes('let variant = default(props.variant, "primary")'));
      assert.ok(result.includes('attrs.class = variant'));
    });

    it('should convert Jinja2 with conditionals to RigScript', () => {
      const source = `{% if disabled %}<span>Disabled</span>{% endif %}`;

      const result = jinja2ToRigScript(source);

      assert.ok(result.includes('if disabled:'));
      assert.ok(result.includes('render.element("span")'));
    });

    it('should convert Jinja2 with loops to RigScript', () => {
      const source = `{% for item in items %}<li>{{ item }}</li>{% endfor %}`;

      const result = jinja2ToRigScript(source);

      assert.ok(result.includes('for item in items:'));
      assert.ok(result.includes('render.element("li")'));
      assert.ok(result.includes('render.text(item)'));
    });

    it('should convert content|safe to render.slot', () => {
      const source = `<div>{{ content | safe }}</div>`;

      const result = jinja2ToRigScript(source);

      assert.ok(result.includes('render.slot("default")'));
    });
  });

  describe('Complex Template Conversion', () => {
    it('should convert button-like template structure', () => {
      const source = `{#
  Button Component
#}
{% set ctx = _component_context %}
{% set variant = ctx.variant | default('primary') %}
{% set disabled = ctx.disabled | default(false) %}

<button
    type="button"
    class="c-button c-button--{{ variant }}"
    {% if disabled %}disabled{% endif %}
>
    {{ ctx.content | safe }}
</button>`;

      const result = jinja2ToRigScript(source, { componentName: 'Button' });

      // Should have proper header
      assert.ok(result.includes('# Lord of the Components - Button Logic'));
      assert.ok(result.includes('# Button Component'));

      // Should have variable declarations
      assert.ok(result.includes('let variant = default(props.variant, "primary")'));
      assert.ok(result.includes('let disabled = default(props.disabled, false)'));

      // Should have render.element
      assert.ok(result.includes('render.element("button")'));

      // Should have attributes
      assert.ok(result.includes('attrs.type = "button"'));

      // Should have conditional attribute
      assert.ok(result.includes('if disabled:'));

      // Should have slot for content
      assert.ok(result.includes('render.slot("default")'));
    });
  });
});

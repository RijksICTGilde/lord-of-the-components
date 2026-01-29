/**
 * Unit tests for HTML Structure Analyzer
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  HtmlAnalyzer,
  analyzeHtml,
  analyzeHtmlFragment,
  flattenElements,
  findByTag,
  findByClass,
  findById,
  type HtmlDocumentIR,
  type HtmlElementIR,
  type HtmlTextIR,
  type HtmlCommentIR,
} from './html-analyzer.js';

describe('HtmlAnalyzer', () => {
  describe('Document Parsing', () => {
    it('should parse DOCTYPE', () => {
      const source = '<!DOCTYPE html><html></html>';

      const result = analyzeHtml(source);

      assert.strictEqual(result.type, 'Document');
      assert.ok(result.doctype);
      assert.ok(result.doctype.toLowerCase().includes('doctype'));
    });

    it('should handle document without DOCTYPE', () => {
      const source = '<html><body>Content</body></html>';

      const result = analyzeHtml(source);

      assert.strictEqual(result.doctype, undefined);
      assert.strictEqual(result.children.length, 1);
    });
  });

  describe('Element Parsing', () => {
    it('should parse simple element', () => {
      const nodes = analyzeHtmlFragment('<div>Content</div>');

      assert.strictEqual(nodes.length, 1);
      const element = nodes[0] as HtmlElementIR;
      assert.strictEqual(element.type, 'Element');
      assert.strictEqual(element.tag, 'div');
    });

    it('should parse nested elements', () => {
      const nodes = analyzeHtmlFragment('<div><span>Text</span></div>');

      const element = nodes[0] as HtmlElementIR;
      assert.strictEqual(element.tag, 'div');
      assert.strictEqual(element.children.length, 1);
      const child = element.children[0] as HtmlElementIR;
      assert.strictEqual(child.tag, 'span');
    });

    it('should parse self-closing elements', () => {
      const nodes = analyzeHtmlFragment('<input type="text" />');

      const element = nodes[0] as HtmlElementIR;
      assert.strictEqual(element.tag, 'input');
      assert.strictEqual(element.selfClosing, true);
    });

    it('should parse void elements without explicit close', () => {
      const nodes = analyzeHtmlFragment('<br><hr>');

      assert.strictEqual(nodes.length, 2);
      assert.strictEqual((nodes[0] as HtmlElementIR).tag, 'br');
      assert.strictEqual((nodes[0] as HtmlElementIR).selfClosing, true);
      assert.strictEqual((nodes[1] as HtmlElementIR).tag, 'hr');
    });

    it('should handle case-insensitive closing tags', () => {
      const nodes = analyzeHtmlFragment('<DIV>Content</div>');

      const element = nodes[0] as HtmlElementIR;
      assert.strictEqual(element.tag, 'DIV');
      const text = element.children[0] as HtmlTextIR;
      assert.strictEqual(text.value, 'Content');
    });

    it('should parse multiple sibling elements', () => {
      const nodes = analyzeHtmlFragment('<div>One</div><div>Two</div>');

      assert.strictEqual(nodes.length, 2);
      assert.strictEqual((nodes[0] as HtmlElementIR).tag, 'div');
      assert.strictEqual((nodes[1] as HtmlElementIR).tag, 'div');
    });
  });

  describe('Attribute Parsing', () => {
    it('should parse static attributes', () => {
      const nodes = analyzeHtmlFragment('<button type="submit" class="btn">Click</button>');

      const element = nodes[0] as HtmlElementIR;
      assert.strictEqual(element.attributes.length, 2);

      const typeAttr = element.attributes.find(a => a.name === 'type');
      assert.ok(typeAttr);
      assert.strictEqual(typeAttr.value, 'submit');
      assert.strictEqual(typeAttr.quoted, true);

      const classAttr = element.attributes.find(a => a.name === 'class');
      assert.ok(classAttr);
      assert.strictEqual(classAttr.value, 'btn');
    });

    it('should parse boolean attributes', () => {
      const nodes = analyzeHtmlFragment('<input disabled readonly>');

      const element = nodes[0] as HtmlElementIR;
      const disabled = element.attributes.find(a => a.name === 'disabled');
      const readonly = element.attributes.find(a => a.name === 'readonly');

      assert.ok(disabled);
      assert.strictEqual(disabled.value, null);
      assert.ok(readonly);
      assert.strictEqual(readonly.value, null);
    });

    it('should parse single-quoted attributes', () => {
      const nodes = analyzeHtmlFragment("<div class='single-quoted'></div>");

      const element = nodes[0] as HtmlElementIR;
      const classAttr = element.attributes.find(a => a.name === 'class');

      assert.ok(classAttr);
      assert.strictEqual(classAttr.value, 'single-quoted');
      assert.strictEqual(classAttr.quoteChar, "'");
    });

    it('should parse unquoted attributes', () => {
      const nodes = analyzeHtmlFragment('<input type=text>');

      const element = nodes[0] as HtmlElementIR;
      const typeAttr = element.attributes.find(a => a.name === 'type');

      assert.ok(typeAttr);
      assert.strictEqual(typeAttr.value, 'text');
      assert.strictEqual(typeAttr.quoted, false);
    });

    it('should parse attributes with special characters', () => {
      const nodes = analyzeHtmlFragment('<div data-value="hello world" data-json=\'{"a":1}\'></div>');

      const element = nodes[0] as HtmlElementIR;
      const valueAttr = element.attributes.find(a => a.name === 'data-value');
      const jsonAttr = element.attributes.find(a => a.name === 'data-json');

      assert.ok(valueAttr);
      assert.strictEqual(valueAttr.value, 'hello world');
      assert.ok(jsonAttr);
      assert.strictEqual(jsonAttr.value, '{"a":1}');
    });
  });

  describe('Text Content', () => {
    it('should parse text content', () => {
      const nodes = analyzeHtmlFragment('<p>Hello World</p>');

      const element = nodes[0] as HtmlElementIR;
      const text = element.children[0] as HtmlTextIR;

      assert.strictEqual(text.type, 'Text');
      assert.strictEqual(text.value, 'Hello World');
      assert.strictEqual(text.isWhitespaceOnly, false);
    });

    it('should preserve significant whitespace', () => {
      const analyzer = new HtmlAnalyzer({ preserveWhitespace: true });
      const nodes = analyzer.analyzeFragment('<div>  spaced  </div>');

      const element = nodes[0] as HtmlElementIR;
      const text = element.children[0] as HtmlTextIR;

      assert.strictEqual(text.value, '  spaced  ');
    });

    it('should filter whitespace-only nodes by default', () => {
      const nodes = analyzeHtmlFragment('<div>\n  <span>Text</span>\n</div>');

      const element = nodes[0] as HtmlElementIR;
      // Should only have the span, not whitespace nodes
      assert.strictEqual(element.children.length, 1);
      assert.strictEqual((element.children[0] as HtmlElementIR).tag, 'span');
    });
  });

  describe('Comments', () => {
    it('should parse HTML comments', () => {
      const nodes = analyzeHtmlFragment('<!-- This is a comment --><div></div>');

      assert.strictEqual(nodes.length, 2);
      const comment = nodes[0] as HtmlCommentIR;
      assert.strictEqual(comment.type, 'Comment');
      assert.strictEqual(comment.value, 'This is a comment');
    });

    it('should parse inline comments', () => {
      const nodes = analyzeHtmlFragment('<div><!-- inline comment -->Text</div>');

      const element = nodes[0] as HtmlElementIR;
      const comment = element.children.find(c => c.type === 'Comment') as HtmlCommentIR;

      assert.ok(comment);
      assert.strictEqual(comment.value, 'inline comment');
    });
  });

  describe('Class Metadata', () => {
    it('should extract static class names', () => {
      const nodes = analyzeHtmlFragment('<div class="c-button c-button--primary"></div>');

      const element = nodes[0] as HtmlElementIR;
      const { classes } = element.metadata;

      assert.deepStrictEqual(classes.static, ['c-button', 'c-button--primary']);
    });

    it('should detect BEM block', () => {
      const nodes = analyzeHtmlFragment('<div class="c-button c-button--primary c-button--large"></div>');

      const element = nodes[0] as HtmlElementIR;
      const { classes } = element.metadata;

      assert.strictEqual(classes.bemBlock, 'c-button');
      assert.deepStrictEqual(classes.bemModifiers, ['primary', 'large']);
    });

    it('should handle multiple BEM elements', () => {
      const nodes = analyzeHtmlFragment('<div class="c-card__header c-card__header--sticky"></div>');

      const element = nodes[0] as HtmlElementIR;
      const { classes } = element.metadata;

      // The block detection finds shortest non-modifier class
      assert.strictEqual(classes.static.length, 2);
    });

    it('should detect dynamic class bindings (Vue)', () => {
      const nodes = analyzeHtmlFragment('<div :class="computedClasses"></div>');

      const element = nodes[0] as HtmlElementIR;
      const { classes } = element.metadata;

      assert.deepStrictEqual(classes.dynamic, ['computedClasses']);
    });

    it('should handle empty class attribute', () => {
      const nodes = analyzeHtmlFragment('<div class=""></div>');

      const element = nodes[0] as HtmlElementIR;
      const { classes } = element.metadata;

      assert.deepStrictEqual(classes.static, []);
    });
  });

  describe('Event Handlers', () => {
    it('should detect vanilla onclick handlers', () => {
      const nodes = analyzeHtmlFragment('<button onclick="handleClick()">Click</button>');

      const element = nodes[0] as HtmlElementIR;
      const { eventHandlers } = element.metadata;

      assert.strictEqual(eventHandlers.length, 1);
      assert.strictEqual(eventHandlers[0].event, 'click');
      assert.strictEqual(eventHandlers[0].framework, 'vanilla');
      assert.strictEqual(eventHandlers[0].value, 'handleClick()');
    });

    it('should detect Vue @click handlers', () => {
      const nodes = analyzeHtmlFragment('<button @click="handleClick">Click</button>');

      const element = nodes[0] as HtmlElementIR;
      const { eventHandlers } = element.metadata;

      assert.strictEqual(eventHandlers.length, 1);
      assert.strictEqual(eventHandlers[0].event, 'click');
      assert.strictEqual(eventHandlers[0].framework, 'vue');
    });

    it('should detect Vue v-on:click handlers', () => {
      const nodes = analyzeHtmlFragment('<button v-on:click="handleClick">Click</button>');

      const element = nodes[0] as HtmlElementIR;
      const { eventHandlers } = element.metadata;

      assert.strictEqual(eventHandlers.length, 1);
      assert.strictEqual(eventHandlers[0].event, 'click');
      assert.strictEqual(eventHandlers[0].framework, 'vue');
    });

    it('should detect Alpine.js x-on:click handlers', () => {
      const nodes = analyzeHtmlFragment('<button x-on:click="handleClick">Click</button>');

      const element = nodes[0] as HtmlElementIR;
      const { eventHandlers } = element.metadata;

      assert.strictEqual(eventHandlers.length, 1);
      assert.strictEqual(eventHandlers[0].event, 'click');
      assert.strictEqual(eventHandlers[0].framework, 'alpine');
    });

    it('should detect multiple event handlers', () => {
      const nodes = analyzeHtmlFragment('<input onchange="validate()" onfocus="highlight()">');

      const element = nodes[0] as HtmlElementIR;
      const { eventHandlers } = element.metadata;

      assert.strictEqual(eventHandlers.length, 2);
      const events = eventHandlers.map(h => h.event);
      assert.ok(events.includes('change'));
      assert.ok(events.includes('focus'));
    });
  });

  describe('Data Attributes', () => {
    it('should extract data attributes', () => {
      const nodes = analyzeHtmlFragment('<div data-id="123" data-name="test"></div>');

      const element = nodes[0] as HtmlElementIR;
      const { dataAttributes } = element.metadata;

      assert.strictEqual(dataAttributes.length, 2);

      const idAttr = dataAttributes.find(a => a.name === 'id');
      assert.ok(idAttr);
      assert.strictEqual(idAttr.value, '123');
      assert.strictEqual(idAttr.fullName, 'data-id');

      const nameAttr = dataAttributes.find(a => a.name === 'name');
      assert.ok(nameAttr);
      assert.strictEqual(nameAttr.value, 'test');
    });

    it('should handle boolean data attributes', () => {
      const nodes = analyzeHtmlFragment('<div data-loading></div>');

      const element = nodes[0] as HtmlElementIR;
      const { dataAttributes } = element.metadata;

      assert.strictEqual(dataAttributes.length, 1);
      assert.strictEqual(dataAttributes[0].name, 'loading');
      assert.strictEqual(dataAttributes[0].value, null);
    });
  });

  describe('ARIA Attributes', () => {
    it('should extract aria attributes', () => {
      const nodes = analyzeHtmlFragment('<button aria-label="Close" aria-expanded="true"></button>');

      const element = nodes[0] as HtmlElementIR;
      const { ariaAttributes } = element.metadata;

      assert.strictEqual(ariaAttributes.length, 2);

      const labelAttr = ariaAttributes.find(a => a.name === 'label');
      assert.ok(labelAttr);
      assert.strictEqual(labelAttr.value, 'Close');
      assert.strictEqual(labelAttr.fullName, 'aria-label');

      const expandedAttr = ariaAttributes.find(a => a.name === 'expanded');
      assert.ok(expandedAttr);
      assert.strictEqual(expandedAttr.value, 'true');
    });
  });

  describe('ID Extraction', () => {
    it('should extract element ID', () => {
      const nodes = analyzeHtmlFragment('<div id="main-content"></div>');

      const element = nodes[0] as HtmlElementIR;
      const { hasId, id } = element.metadata;

      assert.strictEqual(hasId, true);
      assert.strictEqual(id, 'main-content');
    });

    it('should handle element without ID', () => {
      const nodes = analyzeHtmlFragment('<div class="container"></div>');

      const element = nodes[0] as HtmlElementIR;
      const { hasId, id } = element.metadata;

      assert.strictEqual(hasId, false);
      assert.strictEqual(id, undefined);
    });
  });

  describe('Utility Functions', () => {
    describe('flattenElements', () => {
      it('should flatten nested elements', () => {
        const doc = analyzeHtml('<div><span><a></a></span></div>');
        const elements = flattenElements(doc);

        assert.strictEqual(elements.length, 3);
        assert.strictEqual(elements[0].tag, 'div');
        assert.strictEqual(elements[1].tag, 'span');
        assert.strictEqual(elements[2].tag, 'a');
      });
    });

    describe('findByTag', () => {
      it('should find elements by tag name', () => {
        const doc = analyzeHtml('<div><span>One</span><span>Two</span></div>');
        const spans = findByTag(doc, 'span');

        assert.strictEqual(spans.length, 2);
      });

      it('should be case-insensitive', () => {
        const doc = analyzeHtml('<DIV><SPAN>Text</SPAN></DIV>');
        const spans = findByTag(doc, 'span');

        assert.strictEqual(spans.length, 1);
      });
    });

    describe('findByClass', () => {
      it('should find elements by class name', () => {
        const doc = analyzeHtml('<div class="c-button"></div><div class="c-button c-button--primary"></div>');
        const buttons = findByClass(doc, 'c-button');

        assert.strictEqual(buttons.length, 2);
      });
    });

    describe('findById', () => {
      it('should find element by ID', () => {
        const doc = analyzeHtml('<div><span id="target">Found</span></div>');
        const element = findById(doc, 'target');

        assert.ok(element);
        assert.strictEqual(element.tag, 'span');
      });

      it('should return undefined for non-existent ID', () => {
        const doc = analyzeHtml('<div></div>');
        const element = findById(doc, 'not-found');

        assert.strictEqual(element, undefined);
      });
    });
  });

  describe('Real-World Templates', () => {
    it('should parse a complete button component', () => {
      const source = `
<button
    type="button"
    class="c-button c-button--primary c-button--large"
    id="submit-btn"
    data-action="submit"
    aria-label="Submit form"
    onclick="handleSubmit()"
>
    <span class="c-button__icon">→</span>
    <span class="c-button__text">Submit</span>
</button>`;

      const nodes = analyzeHtmlFragment(source);

      assert.strictEqual(nodes.length, 1);
      const button = nodes[0] as HtmlElementIR;

      // Tag
      assert.strictEqual(button.tag, 'button');

      // Classes
      assert.deepStrictEqual(button.metadata.classes.static, [
        'c-button', 'c-button--primary', 'c-button--large'
      ]);
      assert.strictEqual(button.metadata.classes.bemBlock, 'c-button');
      assert.deepStrictEqual(button.metadata.classes.bemModifiers, ['primary', 'large']);

      // ID
      assert.strictEqual(button.metadata.id, 'submit-btn');

      // Data attributes
      assert.strictEqual(button.metadata.dataAttributes.length, 1);
      assert.strictEqual(button.metadata.dataAttributes[0].name, 'action');

      // ARIA
      assert.strictEqual(button.metadata.ariaAttributes.length, 1);
      assert.strictEqual(button.metadata.ariaAttributes[0].name, 'label');

      // Event handlers
      assert.strictEqual(button.metadata.eventHandlers.length, 1);
      assert.strictEqual(button.metadata.eventHandlers[0].event, 'click');

      // Children
      assert.strictEqual(button.children.length, 2);
      const icon = button.children[0] as HtmlElementIR;
      const text = button.children[1] as HtmlElementIR;
      assert.strictEqual(icon.metadata.classes.static[0], 'c-button__icon');
      assert.strictEqual(text.metadata.classes.static[0], 'c-button__text');
    });

    it('should parse a card component', () => {
      const source = `
<article class="c-card" data-variant="elevated">
    <header class="c-card__header">
        <h2 class="c-card__title">Title</h2>
    </header>
    <div class="c-card__body">
        <p>Content goes here</p>
    </div>
    <footer class="c-card__footer">
        <button class="c-button">Action</button>
    </footer>
</article>`;

      const nodes = analyzeHtmlFragment(source);

      const card = nodes[0] as HtmlElementIR;
      assert.strictEqual(card.tag, 'article');
      assert.strictEqual(card.children.length, 3);

      // Find nested elements
      const elements = flattenElements(nodes);
      const titles = findByClass(nodes, 'c-card__title');
      assert.strictEqual(titles.length, 1);
      assert.strictEqual(titles[0].tag, 'h2');
    });
  });
});

/**
 * Lord of the Components - HTML Structure Analyzer
 *
 * Parses HTML templates and extracts their structure into an
 * element tree with attribute metadata, class patterns, and event handlers.
 */

// =============================================================================
// HTML STRUCTURE TYPES
// =============================================================================

export interface HtmlDocumentIR {
  type: 'Document';
  doctype?: string;
  children: HtmlNodeIR[];
}

export type HtmlNodeIR =
  | HtmlElementIR
  | HtmlTextIR
  | HtmlCommentIR;

export interface HtmlElementIR {
  type: 'Element';
  tag: string;
  attributes: HtmlAttributeIR[];
  children: HtmlNodeIR[];
  selfClosing: boolean;
  metadata: ElementMetadata;
}

export interface HtmlTextIR {
  type: 'Text';
  value: string;
  isWhitespaceOnly: boolean;
}

export interface HtmlCommentIR {
  type: 'Comment';
  value: string;
}

export interface HtmlAttributeIR {
  name: string;
  value: string | null; // null for boolean attributes
  quoted: boolean;
  quoteChar?: '"' | "'";
}

export interface ElementMetadata {
  classes: ClassInfo;
  eventHandlers: EventHandler[];
  dataAttributes: DataAttribute[];
  ariaAttributes: AriaAttribute[];
  hasId: boolean;
  id?: string;
}

export interface ClassInfo {
  static: string[];      // Static class names
  dynamic: string[];     // Dynamic class patterns (e.g., from frameworks)
  bemBlock?: string;     // Detected BEM block name
  bemModifiers: string[]; // Detected BEM modifiers
}

export interface EventHandler {
  event: string;          // Event name (click, submit, etc.)
  attributeName: string;  // Original attribute name (onclick, @click, v-on:click)
  value: string;          // Handler value/expression
  framework?: 'vanilla' | 'vue' | 'alpine' | 'htmx';
}

export interface DataAttribute {
  name: string;           // Without 'data-' prefix
  fullName: string;       // Full attribute name
  value: string | null;
}

export interface AriaAttribute {
  name: string;           // Without 'aria-' prefix
  fullName: string;       // Full attribute name
  value: string | null;
}

// =============================================================================
// ANALYZER CLASS
// =============================================================================

interface HtmlAnalyzerOptions {
  preserveWhitespace?: boolean;
  detectBem?: boolean;
  detectEventFramework?: boolean;
}

export class HtmlAnalyzer {
  private source: string = '';
  private pos: number = 0;
  private options: Required<HtmlAnalyzerOptions>;

  private static readonly VOID_ELEMENTS = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr'
  ]);

  private static readonly EVENT_PATTERNS: Array<{
    pattern: RegExp;
    framework: EventHandler['framework'];
    extractEvent: (attr: string) => string;
  }> = [
    // Vanilla JS: onclick, onsubmit, etc.
    {
      pattern: /^on([a-z]+)$/i,
      framework: 'vanilla',
      extractEvent: (attr) => attr.slice(2).toLowerCase()
    },
    // Vue.js: @click, v-on:click
    {
      pattern: /^@([a-z]+(?:\.[a-z]+)*)$/i,
      framework: 'vue',
      extractEvent: (attr) => attr.slice(1).split('.')[0]
    },
    {
      pattern: /^v-on:([a-z]+(?:\.[a-z]+)*)$/i,
      framework: 'vue',
      extractEvent: (attr) => attr.slice(5).split('.')[0]
    },
    // Alpine.js: x-on:click, @click (same as Vue)
    {
      pattern: /^x-on:([a-z]+(?:\.[a-z]+)*)$/i,
      framework: 'alpine',
      extractEvent: (attr) => attr.slice(5).split('.')[0]
    },
    // HTMX: hx-on:click, hx-on::after-request
    {
      pattern: /^hx-on:?:?([a-z-]+)$/i,
      framework: 'htmx',
      extractEvent: (attr) => attr.replace(/^hx-on:?:?/, '')
    }
  ];

  constructor(options: HtmlAnalyzerOptions = {}) {
    this.options = {
      preserveWhitespace: options.preserveWhitespace ?? false,
      detectBem: options.detectBem ?? true,
      detectEventFramework: options.detectEventFramework ?? true,
    };
  }

  /**
   * Analyze an HTML document and return its structure
   */
  analyze(source: string): HtmlDocumentIR {
    this.source = source;
    this.pos = 0;

    const doctype = this.parseDoctype();
    const children = this.parseNodes();

    return {
      type: 'Document',
      doctype,
      children,
    };
  }

  /**
   * Analyze just an HTML fragment (no doctype expected)
   */
  analyzeFragment(source: string): HtmlNodeIR[] {
    this.source = source;
    this.pos = 0;

    return this.parseNodes();
  }

  // ===========================================================================
  // PARSING METHODS
  // ===========================================================================

  private parseDoctype(): string | undefined {
    this.skipWhitespace();

    if (this.lookingAtIgnoreCase('<!doctype')) {
      const start = this.pos;
      this.skipPast('>');
      return this.source.slice(start, this.pos);
    }

    return undefined;
  }

  private parseNodes(): HtmlNodeIR[] {
    const nodes: HtmlNodeIR[] = [];

    while (this.pos < this.source.length) {
      const node = this.parseNode();
      if (node) {
        // Filter out whitespace-only text nodes if not preserving whitespace
        if (node.type === 'Text' && node.isWhitespaceOnly && !this.options.preserveWhitespace) {
          continue;
        }
        nodes.push(node);
      }
    }

    return nodes;
  }

  private parseNode(): HtmlNodeIR | null {
    if (this.pos >= this.source.length) {
      return null;
    }

    // HTML comment
    if (this.lookingAt('<!--')) {
      return this.parseComment();
    }

    // End tag (handled by parent element parser)
    if (this.lookingAt('</')) {
      return null;
    }

    // Element
    if (this.lookingAt('<')) {
      return this.parseElement();
    }

    // Text content
    return this.parseText();
  }

  private parseComment(): HtmlCommentIR | null {
    if (!this.consume('<!--')) {
      return null;
    }

    const start = this.pos;
    const end = this.source.indexOf('-->', start);

    if (end === -1) {
      // Unclosed comment, consume rest
      const value = this.source.slice(start);
      this.pos = this.source.length;
      return { type: 'Comment', value: value.trim() };
    }

    const value = this.source.slice(start, end);
    this.pos = end + 3;

    return { type: 'Comment', value: value.trim() };
  }

  private parseElement(): HtmlElementIR | null {
    if (!this.consume('<')) {
      return null;
    }

    const tag = this.parseTagName();
    if (!tag) {
      return null;
    }

    const attributes = this.parseAttributes();
    const metadata = this.extractMetadata(tag, attributes);

    // Check for self-closing or void element
    const isVoidElement = HtmlAnalyzer.VOID_ELEMENTS.has(tag.toLowerCase());
    const hasSelfClosingSlash = this.consume('/>');
    const selfClosing = hasSelfClosingSlash || isVoidElement;

    // Consume the closing > if we haven't consumed /> already
    if (!hasSelfClosingSlash) {
      this.consume('>');
    }

    const children: HtmlNodeIR[] = [];

    if (!selfClosing) {
      // Parse children until closing tag
      const closeTag = `</${tag}>`;
      const closeTagLower = closeTag.toLowerCase();

      while (this.pos < this.source.length) {
        // Check for closing tag (case-insensitive)
        if (this.lookingAtIgnoreCase(closeTag)) {
          break;
        }

        const child = this.parseNode();
        if (child) {
          // Filter whitespace-only text if not preserving
          if (child.type === 'Text' && child.isWhitespaceOnly && !this.options.preserveWhitespace) {
            continue;
          }
          children.push(child);
        } else {
          // parseNode returned null, might be at an end tag for a different element
          break;
        }
      }

      // Consume closing tag
      this.consumeIgnoreCase(closeTag);
    }

    return {
      type: 'Element',
      tag,
      attributes,
      children,
      selfClosing,
      metadata,
    };
  }

  private parseAttributes(): HtmlAttributeIR[] {
    const attributes: HtmlAttributeIR[] = [];

    while (true) {
      this.skipWhitespace();

      // End of tag
      if (this.lookingAt('>') || this.lookingAt('/>') || this.pos >= this.source.length) {
        break;
      }

      const attr = this.parseAttribute();
      if (attr) {
        attributes.push(attr);
      } else {
        break;
      }
    }

    return attributes;
  }

  private parseAttribute(): HtmlAttributeIR | null {
    const name = this.parseAttributeName();
    if (!name) {
      return null;
    }

    this.skipWhitespace();

    // Boolean attribute (no value)
    if (!this.lookingAt('=')) {
      return {
        name,
        value: null,
        quoted: false,
      };
    }

    this.consume('=');
    this.skipWhitespace();

    // Quoted value
    const quote = this.peek();
    if (quote === '"' || quote === "'") {
      this.advance();
      const value = this.parseUntil(quote);
      this.advance(); // Consume closing quote

      return {
        name,
        value,
        quoted: true,
        quoteChar: quote,
      };
    }

    // Unquoted value
    const value = this.parseUnquotedValue();
    return {
      name,
      value,
      quoted: false,
    };
  }

  private parseText(): HtmlTextIR {
    let text = '';

    while (this.pos < this.source.length) {
      if (this.lookingAt('<')) {
        break;
      }
      text += this.advance();
    }

    return {
      type: 'Text',
      value: text,
      isWhitespaceOnly: /^\s*$/.test(text),
    };
  }

  // ===========================================================================
  // METADATA EXTRACTION
  // ===========================================================================

  private extractMetadata(tag: string, attributes: HtmlAttributeIR[]): ElementMetadata {
    const classes = this.extractClassInfo(attributes);
    const eventHandlers = this.extractEventHandlers(attributes);
    const dataAttributes = this.extractDataAttributes(attributes);
    const ariaAttributes = this.extractAriaAttributes(attributes);
    const idAttr = attributes.find(a => a.name.toLowerCase() === 'id');

    return {
      classes,
      eventHandlers,
      dataAttributes,
      ariaAttributes,
      hasId: !!idAttr,
      id: idAttr?.value ?? undefined,
    };
  }

  private extractClassInfo(attributes: HtmlAttributeIR[]): ClassInfo {
    const classAttr = attributes.find(a => a.name === 'class');
    const staticClasses: string[] = [];
    const dynamicClasses: string[] = [];

    if (classAttr?.value) {
      // Split class string into individual classes
      const classes = classAttr.value.split(/\s+/).filter(c => c.length > 0);

      for (const cls of classes) {
        // Check if it looks like a dynamic class (e.g., contains {{ }}, ${}, etc.)
        if (this.isDynamicClass(cls)) {
          dynamicClasses.push(cls);
        } else {
          staticClasses.push(cls);
        }
      }
    }

    // Also check for framework-specific class bindings
    for (const attr of attributes) {
      // Vue: :class, v-bind:class
      // Alpine: x-bind:class, :class
      // Angular: [class], [ngClass]
      if (attr.name === ':class' || attr.name === 'v-bind:class' ||
          attr.name === 'x-bind:class' || attr.name === '[class]' ||
          attr.name === '[ngClass]') {
        if (attr.value) {
          dynamicClasses.push(attr.value);
        }
      }
    }

    // BEM detection
    let bemBlock: string | undefined;
    const bemModifiers: string[] = [];

    if (this.options.detectBem && staticClasses.length > 0) {
      // Find potential BEM block (shortest class without -- or __)
      const potentialBlocks = staticClasses.filter(c => !c.includes('--') && !c.includes('__'));
      if (potentialBlocks.length > 0) {
        bemBlock = potentialBlocks.sort((a, b) => a.length - b.length)[0];

        // Find modifiers
        for (const cls of staticClasses) {
          if (cls.startsWith(`${bemBlock}--`)) {
            bemModifiers.push(cls.slice(bemBlock.length + 2));
          }
        }
      }
    }

    return {
      static: staticClasses,
      dynamic: dynamicClasses,
      bemBlock,
      bemModifiers,
    };
  }

  private isDynamicClass(cls: string): boolean {
    // Check for template syntax patterns
    return /\{\{.*\}\}/.test(cls) ||   // Jinja2/Vue/Angular
           /\$\{.*\}/.test(cls) ||      // Template literals
           /^[\[\(].*[\]\)]$/.test(cls); // Angular bindings
  }

  private extractEventHandlers(attributes: HtmlAttributeIR[]): EventHandler[] {
    if (!this.options.detectEventFramework) {
      return [];
    }

    const handlers: EventHandler[] = [];

    for (const attr of attributes) {
      for (const { pattern, framework, extractEvent } of HtmlAnalyzer.EVENT_PATTERNS) {
        if (pattern.test(attr.name)) {
          handlers.push({
            event: extractEvent(attr.name),
            attributeName: attr.name,
            value: attr.value ?? '',
            framework,
          });
          break;
        }
      }
    }

    return handlers;
  }

  private extractDataAttributes(attributes: HtmlAttributeIR[]): DataAttribute[] {
    return attributes
      .filter(a => a.name.startsWith('data-'))
      .map(a => ({
        name: a.name.slice(5), // Remove 'data-' prefix
        fullName: a.name,
        value: a.value,
      }));
  }

  private extractAriaAttributes(attributes: HtmlAttributeIR[]): AriaAttribute[] {
    return attributes
      .filter(a => a.name.startsWith('aria-'))
      .map(a => ({
        name: a.name.slice(5), // Remove 'aria-' prefix
        fullName: a.name,
        value: a.value,
      }));
  }

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  private peek(): string {
    return this.source[this.pos] ?? '';
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

  private parseUntil(char: string): string {
    let value = '';
    while (this.pos < this.source.length && this.peek() !== char) {
      value += this.advance();
    }
    return value;
  }

  private isTagChar(char: string): boolean {
    return /[a-zA-Z0-9-]/.test(char);
  }

  private isAttributeStartChar(char: string): boolean {
    // Include characters for framework-specific attributes
    return /[a-zA-Z_:@\[\(]/.test(char);
  }

  private isAttributeChar(char: string): boolean {
    // Include characters for framework-specific attributes
    return /[a-zA-Z0-9_:.\-@\[\]\(\)]/.test(char);
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Analyze an HTML document
 */
export function analyzeHtml(source: string, options?: HtmlAnalyzerOptions): HtmlDocumentIR {
  const analyzer = new HtmlAnalyzer(options);
  return analyzer.analyze(source);
}

/**
 * Analyze an HTML fragment (no doctype)
 */
export function analyzeHtmlFragment(source: string, options?: HtmlAnalyzerOptions): HtmlNodeIR[] {
  const analyzer = new HtmlAnalyzer(options);
  return analyzer.analyzeFragment(source);
}

/**
 * Extract all elements from a document as a flat list
 */
export function flattenElements(doc: HtmlDocumentIR | HtmlNodeIR[]): HtmlElementIR[] {
  const elements: HtmlElementIR[] = [];
  const nodes = Array.isArray(doc) ? doc : doc.children;

  function visit(node: HtmlNodeIR): void {
    if (node.type === 'Element') {
      elements.push(node);
      for (const child of node.children) {
        visit(child);
      }
    }
  }

  for (const node of nodes) {
    visit(node);
  }

  return elements;
}

/**
 * Find elements by tag name
 */
export function findByTag(doc: HtmlDocumentIR | HtmlNodeIR[], tag: string): HtmlElementIR[] {
  return flattenElements(doc).filter(el => el.tag.toLowerCase() === tag.toLowerCase());
}

/**
 * Find elements by class name
 */
export function findByClass(doc: HtmlDocumentIR | HtmlNodeIR[], className: string): HtmlElementIR[] {
  return flattenElements(doc).filter(el => el.metadata.classes.static.includes(className));
}

/**
 * Find elements by ID
 */
export function findById(doc: HtmlDocumentIR | HtmlNodeIR[], id: string): HtmlElementIR | undefined {
  return flattenElements(doc).find(el => el.metadata.id === id);
}

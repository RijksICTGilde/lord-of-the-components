/**
 * Lord of the Components - Documentation Web Components
 *
 * Generates the JavaScript file containing Web Components
 * for interactive documentation previews.
 */

import type { ComponentDefinition } from '../../types/components.js';

/**
 * Generate the lotc-docs.js file content
 */
export function generateDocsWebComponents(components: ComponentDefinition[]): string {
  // Create a registry object for component metadata
  const registry: Record<string, any> = {};
  for (const comp of components) {
    registry[comp.name] = {
      name: comp.name,
      description: comp.description,
      category: comp.category,
      status: comp.status,
      props: comp.props.map(p => ({
        name: p.name,
        type: p.type,
        required: p.required,
        default: p.default,
        description: p.description,
        enumValues: p.enumValues,
      })),
      slots: comp.slots.map(s => ({
        name: s.name,
        required: s.required,
        description: s.description,
      })),
      examples: comp.examples.map(e => ({
        name: e.name,
        title: e.title,
        description: e.description,
        code: e.code,
      })),
    };
  }

  return `/**
 * Lord of the Components - Documentation Web Components
 * Auto-generated - do not edit
 */

// Component Registry
const LOTC_REGISTRY = ${JSON.stringify(registry, null, 2)};

// =============================================================================
// <lotc-preview> - Live component preview
// =============================================================================

class LotcPreview extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const component = this.getAttribute('component');
    const showCode = this.hasAttribute('show-code');

    this.shadowRoot.innerHTML = \`
      <style>
        :host {
          display: block;
          border: 1px solid var(--docs-border, #e5e7eb);
          border-radius: 8px;
          overflow: hidden;
        }
        .preview {
          padding: 1.5rem;
          background: var(--docs-preview-bg, #f9fafb);
        }
        .code {
          border-top: 1px solid var(--docs-border, #e5e7eb);
          background: var(--docs-code-bg, #1e293b);
          color: var(--docs-code-text, #e2e8f0);
          padding: 1rem;
          font-family: monospace;
          font-size: 0.875rem;
          overflow-x: auto;
          white-space: pre;
        }
        .toolbar {
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem;
          background: var(--docs-toolbar-bg, #f3f4f6);
          border-top: 1px solid var(--docs-border, #e5e7eb);
        }
        .toolbar button {
          padding: 0.25rem 0.75rem;
          border: 1px solid var(--docs-border, #e5e7eb);
          border-radius: 4px;
          background: white;
          cursor: pointer;
          font-size: 0.75rem;
        }
        .toolbar button:hover {
          background: var(--docs-preview-bg, #f9fafb);
        }
      </style>
      <div class="preview">
        <slot></slot>
      </div>
      \${showCode ? \`<div class="code">\${this.escapeHtml(this.innerHTML)}</div>\` : ''}
      <div class="toolbar">
        <button onclick="this.getRootNode().host.toggleCode()">
          \${showCode ? 'Hide Code' : 'Show Code'}
        </button>
        <button onclick="this.getRootNode().host.copyCode()">Copy</button>
      </div>
    \`;
  }

  toggleCode() {
    if (this.hasAttribute('show-code')) {
      this.removeAttribute('show-code');
    } else {
      this.setAttribute('show-code', '');
    }
    this.render();
  }

  copyCode() {
    navigator.clipboard.writeText(this.innerHTML.trim());
  }

  escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

customElements.define('lotc-preview', LotcPreview);

// =============================================================================
// <lotc-props> - Props table
// =============================================================================

class LotcProps extends HTMLElement {
  connectedCallback() {
    const componentName = this.getAttribute('component');
    const component = LOTC_REGISTRY[componentName];

    if (!component) {
      this.innerHTML = '<p>Component not found</p>';
      return;
    }

    if (component.props.length === 0) {
      this.innerHTML = '<p class="no-props">This component has no props.</p>';
      return;
    }

    const rows = component.props.map(prop => \`
      <tr>
        <td><code>\${prop.name}</code></td>
        <td>
          <code>\${prop.type}</code>
          \${prop.enumValues ? \`<br><small>(\${prop.enumValues.join(' | ')})</small>\` : ''}
        </td>
        <td>
          \${prop.required
            ? '<span class="required">Required</span>'
            : prop.default !== undefined && prop.default !== null
              ? \`<code>\${prop.default}</code>\`
              : '—'}
        </td>
        <td>\${prop.description || '—'}</td>
      </tr>
    \`).join('');

    this.innerHTML = \`
      <table class="props-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          \${rows}
        </tbody>
      </table>
    \`;
  }
}

customElements.define('lotc-props', LotcProps);

// =============================================================================
// <lotc-slots> - Slots table
// =============================================================================

class LotcSlots extends HTMLElement {
  connectedCallback() {
    const componentName = this.getAttribute('component');
    const component = LOTC_REGISTRY[componentName];

    if (!component) {
      this.innerHTML = '<p>Component not found</p>';
      return;
    }

    if (component.slots.length === 0) {
      this.innerHTML = '<p class="no-slots">This component has no slots.</p>';
      return;
    }

    const rows = component.slots.map(slot => \`
      <tr>
        <td><code>\${slot.name}</code></td>
        <td>\${slot.required ? '<span class="required">Required</span>' : 'Optional'}</td>
        <td>\${slot.description || '—'}</td>
      </tr>
    \`).join('');

    this.innerHTML = \`
      <table class="slots-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          \${rows}
        </tbody>
      </table>
    \`;
  }
}

customElements.define('lotc-slots', LotcSlots);

// =============================================================================
// <lotc-examples> - Component examples
// =============================================================================

class LotcExamples extends HTMLElement {
  connectedCallback() {
    const componentName = this.getAttribute('component');
    const component = LOTC_REGISTRY[componentName];

    if (!component) {
      this.innerHTML = '<p>Component not found</p>';
      return;
    }

    if (component.examples.length === 0) {
      this.innerHTML = '<p class="no-examples">No examples available yet.</p>';
      return;
    }

    const examples = component.examples.map(example => \`
      <div class="example">
        <h3>\${example.title}</h3>
        \${example.description ? \`<p>\${example.description}</p>\` : ''}
        <lotc-preview component="\${componentName}">
          \${example.code}
        </lotc-preview>
      </div>
    \`).join('');

    this.innerHTML = examples;
  }
}

customElements.define('lotc-examples', LotcExamples);

// =============================================================================
// <lotc-playground> - Interactive playground
// =============================================================================

class LotcPlayground extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.code = '';
  }

  connectedCallback() {
    this.code = this.innerHTML.trim();
    this.render();
  }

  render() {
    const componentName = this.getAttribute('component');
    const component = LOTC_REGISTRY[componentName];

    this.shadowRoot.innerHTML = \`
      <style>
        :host {
          display: block;
          border: 1px solid var(--docs-border, #e5e7eb);
          border-radius: 8px;
          overflow: hidden;
        }
        .preview {
          padding: 1.5rem;
          background: var(--docs-preview-bg, #f9fafb);
          min-height: 100px;
        }
        .editor {
          border-top: 1px solid var(--docs-border, #e5e7eb);
        }
        textarea {
          width: 100%;
          min-height: 150px;
          padding: 1rem;
          border: none;
          background: var(--docs-code-bg, #1e293b);
          color: var(--docs-code-text, #e2e8f0);
          font-family: monospace;
          font-size: 0.875rem;
          resize: vertical;
        }
        textarea:focus {
          outline: none;
        }
        .controls {
          display: flex;
          gap: 0.5rem;
          padding: 0.75rem;
          background: var(--docs-toolbar-bg, #f3f4f6);
          border-top: 1px solid var(--docs-border, #e5e7eb);
          flex-wrap: wrap;
        }
        .control {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .control label {
          font-size: 0.75rem;
          color: var(--docs-text-secondary, #6b7280);
        }
        .control select, .control input {
          padding: 0.25rem 0.5rem;
          border: 1px solid var(--docs-border, #e5e7eb);
          border-radius: 4px;
          font-size: 0.75rem;
        }
        .actions {
          margin-left: auto;
          display: flex;
          gap: 0.5rem;
        }
        .actions button {
          padding: 0.25rem 0.75rem;
          border: 1px solid var(--docs-border, #e5e7eb);
          border-radius: 4px;
          background: white;
          cursor: pointer;
          font-size: 0.75rem;
        }
      </style>
      <div class="preview" id="preview"></div>
      <div class="editor">
        <textarea id="code">\${this.escapeHtml(this.code)}</textarea>
      </div>
      <div class="controls">
        \${component ? this.renderControls(component) : ''}
        <div class="actions">
          <button onclick="this.getRootNode().host.reset()">Reset</button>
          <button onclick="this.getRootNode().host.copy()">Copy</button>
        </div>
      </div>
    \`;

    // Set up preview
    this.updatePreview();

    // Set up live editing
    const textarea = this.shadowRoot.getElementById('code');
    textarea.addEventListener('input', () => {
      this.code = textarea.value;
      this.updatePreview();
    });
  }

  renderControls(component) {
    return component.props
      .filter(p => p.type === 'enum' || p.type === 'boolean' || p.type === 'generic-size' || p.type === 'generic-color')
      .slice(0, 4) // Limit to 4 controls
      .map(prop => {
        if (prop.type === 'boolean') {
          return \`
            <div class="control">
              <label>\${prop.name}</label>
              <input type="checkbox" data-prop="\${prop.name}" \${prop.default ? 'checked' : ''}>
            </div>
          \`;
        }
        const options = prop.enumValues || this.getGenericValues(prop.type);
        return \`
          <div class="control">
            <label>\${prop.name}</label>
            <select data-prop="\${prop.name}">
              \${options.map(v => \`<option value="\${v}" \${v === prop.default ? 'selected' : ''}>\${v}</option>\`).join('')}
            </select>
          </div>
        \`;
      }).join('');
  }

  getGenericValues(type) {
    if (type === 'generic-size') return ['xs', 'sm', 'md', 'lg', 'xl'];
    if (type === 'generic-color') return ['primary', 'secondary', 'success', 'warning', 'error', 'info'];
    return [];
  }

  updatePreview() {
    const preview = this.shadowRoot.getElementById('preview');
    preview.innerHTML = this.code;
  }

  reset() {
    this.code = this.innerHTML.trim();
    const textarea = this.shadowRoot.getElementById('code');
    textarea.value = this.code;
    this.updatePreview();
  }

  copy() {
    navigator.clipboard.writeText(this.code);
  }

  escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

customElements.define('lotc-playground', LotcPlayground);

// =============================================================================
// <lotc-search> - Component search
// =============================================================================

class LotcSearch extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = \`
      <style>
        :host {
          display: block;
          position: relative;
        }
        input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid var(--docs-border, #e5e7eb);
          border-radius: 8px;
          font-size: 1rem;
        }
        input:focus {
          outline: none;
          border-color: var(--docs-link, #3b82f6);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .results {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid var(--docs-border, #e5e7eb);
          border-radius: 8px;
          margin-top: 4px;
          max-height: 300px;
          overflow-y: auto;
          display: none;
          z-index: 100;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .results.visible {
          display: block;
        }
        .result {
          padding: 0.75rem 1rem;
          cursor: pointer;
          border-bottom: 1px solid var(--docs-border, #e5e7eb);
        }
        .result:last-child {
          border-bottom: none;
        }
        .result:hover {
          background: var(--docs-preview-bg, #f9fafb);
        }
        .result-name {
          font-weight: 500;
          color: var(--docs-text, #1f2937);
        }
        .result-desc {
          font-size: 0.875rem;
          color: var(--docs-text-secondary, #6b7280);
        }
        .no-results {
          padding: 1rem;
          text-align: center;
          color: var(--docs-text-secondary, #6b7280);
        }
      </style>
      <input type="search" placeholder="Search components..." />
      <div class="results"></div>
    \`;

    const input = this.shadowRoot.querySelector('input');
    const results = this.shadowRoot.querySelector('.results');

    input.addEventListener('input', () => {
      const query = input.value.toLowerCase().trim();
      if (!query) {
        results.classList.remove('visible');
        return;
      }

      const matches = Object.values(LOTC_REGISTRY).filter(comp =>
        comp.name.toLowerCase().includes(query) ||
        comp.description.toLowerCase().includes(query) ||
        comp.props.some(p => p.name.toLowerCase().includes(query))
      );

      if (matches.length === 0) {
        results.innerHTML = '<div class="no-results">No components found</div>';
      } else {
        results.innerHTML = matches.map(comp => \`
          <a href="components/\${comp.name}.html" class="result">
            <div class="result-name">c-\${comp.name}</div>
            <div class="result-desc">\${comp.description}</div>
          </a>
        \`).join('');
      }
      results.classList.add('visible');
    });

    input.addEventListener('blur', () => {
      setTimeout(() => results.classList.remove('visible'), 200);
    });
  }
}

customElements.define('lotc-search', LotcSearch);

// Export registry for external use
window.LOTC_REGISTRY = LOTC_REGISTRY;
`;
}

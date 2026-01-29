/**
 * Lord of the Components - Documentation Generator
 *
 * Generates a complete documentation site from component definitions.
 */

import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import type { ComponentDefinition, ComponentCategory } from '../../types/components.js';
import { generateDocsWebComponents } from './web-components.js';

// =============================================================================
// TYPES
// =============================================================================

export interface DocsGeneratorOptions {
  outputDir: string;
  title?: string;
  description?: string;
  logo?: string;
  extraHead?: string;
  includePlayground?: boolean;
  includeSearch?: boolean;
  tokensPath?: string;
}

// =============================================================================
// GENERATOR
// =============================================================================

export class DocsGenerator {
  private options: DocsGeneratorOptions;
  private components: ComponentDefinition[] = [];

  constructor(options: DocsGeneratorOptions) {
    this.options = {
      title: 'Lord of the Components',
      description: 'Implementation-agnostic component system',
      includePlayground: true,
      includeSearch: true,
      ...options,
    };
  }

  /**
   * Generate the complete documentation site
   */
  async generate(components: ComponentDefinition[]): Promise<string[]> {
    this.components = components;
    const generatedFiles: string[] = [];

    // Create directories
    await mkdir(this.options.outputDir, { recursive: true });
    await mkdir(join(this.options.outputDir, 'components'), { recursive: true });

    // Generate files
    generatedFiles.push(await this.generateIndexPage());
    generatedFiles.push(await this.generateStyles());
    generatedFiles.push(await this.generateWebComponents());

    // Generate component pages
    for (const component of components) {
      generatedFiles.push(await this.generateComponentPage(component));
    }

    return generatedFiles;
  }

  /**
   * Generate index.html
   */
  private async generateIndexPage(): Promise<string> {
    const categories = this.groupByCategory();
    const categoryOrder: ComponentCategory[] = [
      'layout',
      'actions',
      'inputs',
      'navigation',
      'feedback',
      'data-display',
      'overlay',
      'typography',
      'media',
      'utility',
    ];

    let sectionsHtml = '';
    for (const category of categoryOrder) {
      const categoryComponents = categories.get(category);
      if (!categoryComponents || categoryComponents.length === 0) continue;

      const componentsHtml = categoryComponents
        .map(c => `
          <a href="components/${c.name}.html" class="component-card">
            <div class="component-card__name">c-${c.name}</div>
            <div class="component-card__desc">${c.description}</div>
            <div class="component-card__meta">
              <span class="status status--${c.status}">${c.status}</span>
            </div>
          </a>
        `)
        .join('');

      sectionsHtml += `
        <section class="category-section">
          <h2 class="category-title">${this.formatCategory(category)}</h2>
          <div class="component-grid">
            ${componentsHtml}
          </div>
        </section>
      `;
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.options.title}</title>
  <meta name="description" content="${this.options.description}">
  <link rel="stylesheet" href="docs.css">
  ${this.options.extraHead || ''}
</head>
<body>
  <header class="site-header">
    <div class="site-header__content">
      ${this.options.logo ? `<img src="${this.options.logo}" alt="" class="site-logo">` : ''}
      <div>
        <h1 class="site-title">${this.options.title}</h1>
        <p class="site-desc">${this.options.description}</p>
      </div>
    </div>
    ${this.options.includeSearch ? '<lotc-search></lotc-search>' : ''}
  </header>

  <main class="site-main">
    <div class="stats">
      <div class="stat">
        <span class="stat__value">${this.components.length}</span>
        <span class="stat__label">Components</span>
      </div>
      <div class="stat">
        <span class="stat__value">${this.components.filter(c => c.status === 'stable').length}</span>
        <span class="stat__label">Stable</span>
      </div>
      <div class="stat">
        <span class="stat__value">${new Set(this.components.map(c => c.category)).size}</span>
        <span class="stat__label">Categories</span>
      </div>
    </div>

    ${sectionsHtml}
  </main>

  <footer class="site-footer">
    <p>Generated with Lord of the Components</p>
  </footer>

  <script src="lotc-docs.js"></script>
</body>
</html>`;

    const filePath = join(this.options.outputDir, 'index.html');
    await writeFile(filePath, html);
    return filePath;
  }

  /**
   * Generate component page
   */
  private async generateComponentPage(component: ComponentDefinition): Promise<string> {
    const dependenciesHtml = component.dependsOn && component.dependsOn.length > 0
      ? `
        <section class="doc-section">
          <h2>Dependencies</h2>
          <ul class="dependencies-list">
            ${component.dependsOn.map(d => `<li><a href="${d}.html">c-${d}</a></li>`).join('')}
          </ul>
        </section>
      `
      : '';

    const tokensHtml = Object.keys(component.tokens).length > 0
      ? `
        <section class="doc-section">
          <h2>Design Tokens</h2>
          <table class="tokens-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(component.tokens).map(([name, value]) => `
                <tr>
                  <td><code>${name}</code></td>
                  <td><code>${value}</code></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </section>
      `
      : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>c-${component.name} - ${this.options.title}</title>
  <meta name="description" content="${component.description}">
  <link rel="stylesheet" href="../docs.css">
  ${this.options.tokensPath ? `<link rel="stylesheet" href="../${this.options.tokensPath}">` : ''}
  ${this.options.extraHead || ''}
</head>
<body>
  <header class="page-header">
    <nav class="breadcrumb">
      <a href="../index.html">Components</a>
      <span>/</span>
      <span>c-${component.name}</span>
    </nav>
    <h1 class="page-title">c-${component.name}</h1>
    <p class="page-desc">${component.description}</p>
    <div class="page-meta">
      <span class="status status--${component.status}">${component.status}</span>
      <span class="category-badge">${this.formatCategory(component.category)}</span>
    </div>
  </header>

  <main class="page-main">
    <aside class="page-sidebar">
      <nav class="page-nav">
        <a href="#props">Props</a>
        <a href="#slots">Slots</a>
        <a href="#examples">Examples</a>
        ${this.options.includePlayground ? '<a href="#playground">Playground</a>' : ''}
        ${Object.keys(component.tokens).length > 0 ? '<a href="#tokens">Tokens</a>' : ''}
        ${component.dependsOn?.length ? '<a href="#dependencies">Dependencies</a>' : ''}
      </nav>
    </aside>

    <article class="page-content">
      <section class="doc-section" id="props">
        <h2>Props</h2>
        <lotc-props component="${component.name}"></lotc-props>
      </section>

      <section class="doc-section" id="slots">
        <h2>Slots</h2>
        <lotc-slots component="${component.name}"></lotc-slots>
      </section>

      <section class="doc-section" id="examples">
        <h2>Examples</h2>
        <lotc-examples component="${component.name}"></lotc-examples>
      </section>

      ${this.options.includePlayground ? `
      <section class="doc-section" id="playground">
        <h2>Playground</h2>
        <lotc-playground component="${component.name}">
          ${component.examples[0]?.code || `<c-${component.name}>Example</c-${component.name}>`}
        </lotc-playground>
      </section>
      ` : ''}

      ${tokensHtml}
      ${dependenciesHtml}
    </article>
  </main>

  <script src="../lotc-docs.js"></script>
</body>
</html>`;

    const filePath = join(this.options.outputDir, 'components', `${component.name}.html`);
    await writeFile(filePath, html);
    return filePath;
  }

  /**
   * Generate docs.css
   */
  private async generateStyles(): Promise<string> {
    const css = `/**
 * Lord of the Components - Documentation Styles
 * Auto-generated
 */

/* Variables */
:root {
  --docs-bg: #ffffff;
  --docs-bg-secondary: #f9fafb;
  --docs-text: #111827;
  --docs-text-secondary: #6b7280;
  --docs-link: #3b82f6;
  --docs-border: #e5e7eb;
  --docs-code-bg: #1e293b;
  --docs-code-text: #e2e8f0;
  --docs-radius: 8px;
  --docs-shadow: 0 1px 3px rgba(0,0,0,0.1);

  --status-stable: #22c55e;
  --status-beta: #f59e0b;
  --status-experimental: #ef4444;
  --status-deprecated: #6b7280;
}

@media (prefers-color-scheme: dark) {
  :root {
    --docs-bg: #111827;
    --docs-bg-secondary: #1f2937;
    --docs-text: #f9fafb;
    --docs-text-secondary: #9ca3af;
    --docs-border: #374151;
  }
}

/* Reset */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Base */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: var(--docs-text);
  background: var(--docs-bg);
}

a {
  color: var(--docs-link);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* Site Header */
.site-header {
  padding: 2rem;
  border-bottom: 1px solid var(--docs-border);
  background: var(--docs-bg-secondary);
}

.site-header__content {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.site-logo {
  height: 48px;
  width: auto;
}

.site-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.site-desc {
  color: var(--docs-text-secondary);
}

/* Main */
.site-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Stats */
.stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 3rem;
  padding: 1.5rem;
  background: var(--docs-bg-secondary);
  border-radius: var(--docs-radius);
}

.stat {
  text-align: center;
}

.stat__value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: var(--docs-link);
}

.stat__label {
  font-size: 0.875rem;
  color: var(--docs-text-secondary);
}

/* Category Section */
.category-section {
  margin-bottom: 3rem;
}

.category-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--docs-border);
}

/* Component Grid */
.component-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.component-card {
  display: block;
  padding: 1.25rem;
  background: var(--docs-bg);
  border: 1px solid var(--docs-border);
  border-radius: var(--docs-radius);
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.component-card:hover {
  border-color: var(--docs-link);
  box-shadow: var(--docs-shadow);
  text-decoration: none;
}

.component-card__name {
  font-family: monospace;
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.component-card__desc {
  font-size: 0.875rem;
  color: var(--docs-text-secondary);
  margin-bottom: 0.75rem;
}

.component-card__meta {
  display: flex;
  gap: 0.5rem;
}

/* Status Badge */
.status {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  border-radius: 4px;
  background: var(--docs-bg-secondary);
}

.status--stable { background: #dcfce7; color: #166534; }
.status--beta { background: #fef3c7; color: #92400e; }
.status--experimental { background: #fee2e2; color: #991b1b; }
.status--deprecated { background: #f3f4f6; color: #6b7280; }

/* Category Badge */
.category-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  background: var(--docs-bg-secondary);
  border-radius: 4px;
}

/* Page Header */
.page-header {
  padding: 2rem;
  border-bottom: 1px solid var(--docs-border);
  background: var(--docs-bg-secondary);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.breadcrumb span {
  color: var(--docs-text-secondary);
}

.page-title {
  font-family: monospace;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.page-desc {
  font-size: 1.125rem;
  color: var(--docs-text-secondary);
  margin-bottom: 1rem;
}

.page-meta {
  display: flex;
  gap: 0.75rem;
}

/* Page Layout */
.page-main {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
}

.page-sidebar {
  width: 200px;
  flex-shrink: 0;
  padding: 2rem 1rem;
  border-right: 1px solid var(--docs-border);
}

.page-nav {
  position: sticky;
  top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.page-nav a {
  padding: 0.5rem;
  color: var(--docs-text-secondary);
  border-radius: 4px;
}

.page-nav a:hover {
  background: var(--docs-bg-secondary);
  text-decoration: none;
}

.page-content {
  flex: 1;
  padding: 2rem;
  min-width: 0;
}

/* Doc Section */
.doc-section {
  margin-bottom: 3rem;
}

.doc-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--docs-border);
}

/* Tables */
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

th, td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--docs-border);
}

th {
  font-weight: 600;
  background: var(--docs-bg-secondary);
}

/* Code */
code {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.875em;
  padding: 0.125rem 0.375rem;
  background: var(--docs-bg-secondary);
  border-radius: 4px;
}

pre {
  background: var(--docs-code-bg);
  color: var(--docs-code-text);
  padding: 1rem;
  border-radius: var(--docs-radius);
  overflow-x: auto;
}

pre code {
  background: none;
  padding: 0;
  color: inherit;
}

/* Required indicator */
.required {
  color: #dc2626;
  font-weight: 500;
}

/* Example */
.example {
  margin-bottom: 2rem;
}

.example h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.example > p {
  color: var(--docs-text-secondary);
  margin-bottom: 1rem;
}

/* Footer */
.site-footer {
  padding: 2rem;
  text-align: center;
  border-top: 1px solid var(--docs-border);
  color: var(--docs-text-secondary);
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 768px) {
  .page-main {
    flex-direction: column;
  }

  .page-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--docs-border);
  }

  .page-nav {
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .stats {
    flex-wrap: wrap;
    justify-content: center;
  }

  .component-grid {
    grid-template-columns: 1fr;
  }
}
`;

    const filePath = join(this.options.outputDir, 'docs.css');
    await writeFile(filePath, css);
    return filePath;
  }

  /**
   * Generate lotc-docs.js
   */
  private async generateWebComponents(): Promise<string> {
    const js = generateDocsWebComponents(this.components);
    const filePath = join(this.options.outputDir, 'lotc-docs.js');
    await writeFile(filePath, js);
    return filePath;
  }

  /**
   * Group components by category
   */
  private groupByCategory(): Map<ComponentCategory, ComponentDefinition[]> {
    const map = new Map<ComponentCategory, ComponentDefinition[]>();
    for (const component of this.components) {
      const category = component.category;
      if (!map.has(category)) {
        map.set(category, []);
      }
      map.get(category)!.push(component);
    }
    return map;
  }

  /**
   * Format category name for display
   */
  private formatCategory(category: string): string {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

/**
 * Generate documentation site
 */
export async function generateDocs(
  components: ComponentDefinition[],
  options: DocsGeneratorOptions
): Promise<string[]> {
  const generator = new DocsGenerator(options);
  return generator.generate(components);
}

/**
 * Lord of the Components - Theme Loader
 *
 * Loads theme definitions and connectors from the file system.
 */

import { readdir, stat } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import { parseKdlFile, parseImplementationTokensKdl } from '../parser/kdl-parser.js';
import type { ThemeDefinition, ConnectorDefinition, ConnectorFramework } from '../types/themes.js';
import type { GenericValueAdapter } from '../types/components.js';

export class ThemeLoader {
  private projectRoot: string;
  private themes: Map<string, ThemeDefinition> = new Map();

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Load all themes from the project
   */
  async loadAll(): Promise<ThemeDefinition[]> {
    const themesDir = resolve(this.projectRoot, 'themes');

    try {
      const entries = await readdir(themesDir);

      for (const entry of entries) {
        const themeDir = join(themesDir, entry);
        const stats = await stat(themeDir);

        if (stats.isDirectory()) {
          await this.loadTheme(themeDir, entry);
        }
      }
    } catch (error) {
      // Directory might not exist yet
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    return Array.from(this.themes.values());
  }

  /**
   * Load a single theme
   */
  private async loadTheme(themeDir: string, themeName: string): Promise<void> {
    const themeFile = join(themeDir, 'theme.kdl');

    try {
      const kdl = await parseKdlFile(themeFile);
      const { name, tokens } = parseImplementationTokensKdl(kdl);

      // Load connectors
      const connectors = await this.loadConnectors(themeDir);

      const theme: ThemeDefinition = {
        name: name || themeName,
        tokens,
        connectors,
        filePath: themeFile,
      };

      this.themes.set(theme.name, theme);
    } catch (error) {
      // Theme file might not exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Load connectors for a theme
   */
  private async loadConnectors(themeDir: string): Promise<ConnectorDefinition[]> {
    const connectors: ConnectorDefinition[] = [];

    // Check for connectors in theme directory (e.g., themes/default/jinja2/)
    // and in a dedicated connectors directory (e.g., themes/default/connectors/)
    const connectorsDirs = [
      themeDir,
      join(themeDir, 'connectors'),
    ];

    for (const dir of connectorsDirs) {
      try {
        const entries = await readdir(dir);

        for (const entry of entries) {
          const entryPath = join(dir, entry);
          const stats = await stat(entryPath);

          if (stats.isDirectory()) {
            // Check for connector.kdl in this directory
            const connectorFile = join(entryPath, 'connector.kdl');
            try {
              const connector = await this.loadConnector(connectorFile, entry);
              if (connector) {
                connectors.push(connector);
              }
            } catch {
              // No connector.kdl, might be a framework directory with templates
              // Try to infer connector from directory name
              const inferredConnector = await this.inferConnector(entryPath, entry);
              if (inferredConnector) {
                connectors.push(inferredConnector);
              }
            }
          }
        }
      } catch {
        // Directory doesn't exist, continue
      }
    }

    return connectors;
  }

  /**
   * Load a connector definition
   */
  private async loadConnector(
    connectorFile: string,
    dirName: string
  ): Promise<ConnectorDefinition | null> {
    try {
      const kdl = await parseKdlFile(connectorFile);
      const connectorNode = kdl.getNode('connector');

      if (!connectorNode) {
        return null;
      }

      const name = connectorNode.getString(0) || dirName;
      const framework = (connectorNode.getChild('framework')?.getString(0) ||
        dirName) as ConnectorFramework;
      const templatesPath =
        connectorNode.getChild('templates')?.getString(0) || './templates';

      // Parse component templates
      const componentsNode = connectorNode.getChild('components');
      const components: { component: string; template: string }[] = [];
      if (componentsNode) {
        for (const compNode of componentsNode.children) {
          const template = compNode.getChild('template')?.getString(0);
          if (template) {
            components.push({
              component: compNode.name,
              template,
            });
          }
        }
      }

      // Parse adapters
      const adaptersNode = connectorNode.getChild('adapters');
      const adapters: GenericValueAdapter[] = [];
      if (adaptersNode) {
        for (const adapterNode of adaptersNode.children) {
          const mappings: Record<string, string> = {};
          for (const mapNode of adapterNode.children) {
            mappings[mapNode.name] = mapNode.getString(0) || '';
          }
          adapters.push({
            type: adapterNode.name as 'generic-size' | 'generic-color',
            mappings,
          });
        }
      }

      return {
        name,
        framework,
        templatesPath,
        components,
        adapters: adapters.length > 0 ? adapters : undefined,
        filePath: connectorFile,
      };
    } catch {
      return null;
    }
  }

  /**
   * Infer a connector from a directory structure
   */
  private async inferConnector(
    dir: string,
    dirName: string
  ): Promise<ConnectorDefinition | null> {
    const frameworkMap: Record<string, ConnectorFramework> = {
      jinja2: 'jinja2',
      jinja: 'jinja2',
      react: 'react',
      vue: 'vue',
      html: 'html',
      'web-components': 'web-components',
      webcomponents: 'web-components',
    };

    const framework = frameworkMap[dirName.toLowerCase()];
    if (!framework) {
      return null;
    }

    // Check if there are template files
    try {
      const entries = await readdir(dir);
      const hasTemplates = entries.some(
        (e) =>
          e.endsWith('.html.j2') ||
          e.endsWith('.tsx') ||
          e.endsWith('.vue') ||
          e.endsWith('.html')
      );

      if (!hasTemplates) {
        return null;
      }

      return {
        name: dirName,
        framework,
        templatesPath: '.',
        components: [], // Will be populated during build
        filePath: dir,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get a theme by name
   */
  getTheme(name: string): ThemeDefinition | undefined {
    return this.themes.get(name);
  }

  /**
   * Get all themes
   */
  getThemes(): ThemeDefinition[] {
    return Array.from(this.themes.values());
  }

  /**
   * Get the default theme
   */
  getDefaultTheme(): ThemeDefinition | undefined {
    return this.themes.get('default') || this.themes.values().next().value;
  }

  /**
   * Check if a theme exists
   */
  hasTheme(name: string): boolean {
    return this.themes.has(name);
  }
}

/**
 * Lord of the Components - Component Loader
 *
 * Loads component definitions from the file system.
 */

import { readdir, stat } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import { parseKdlFile, parseComponentKdl } from '../parser/kdl-parser.js';
import type { ComponentDefinition, PackageDefinition } from '../types/components.js';

export class ComponentLoader {
  private projectRoot: string;
  private components: Map<string, ComponentDefinition> = new Map();
  private packages: Map<string, PackageDefinition> = new Map();

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Load all components from the project
   */
  async loadAll(): Promise<ComponentDefinition[]> {
    // Load from packages
    await this.loadPackages();

    // Load standalone components (if any)
    await this.loadComponentsDir(resolve(this.projectRoot, 'components'));

    return Array.from(this.components.values());
  }

  /**
   * Load all packages from packages/
   */
  private async loadPackages(): Promise<void> {
    const packagesDir = resolve(this.projectRoot, 'packages');

    try {
      const entries = await readdir(packagesDir);

      for (const entry of entries) {
        const packageDir = join(packagesDir, entry);
        const stats = await stat(packageDir);

        if (stats.isDirectory()) {
          await this.loadPackage(packageDir);
        }
      }
    } catch (error) {
      // Directory might not exist yet
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Load a single package
   */
  private async loadPackage(packageDir: string): Promise<void> {
    const packageFile = join(packageDir, 'package.kdl');

    try {
      const kdl = await parseKdlFile(packageFile);
      const packageNode = kdl.getNode('package');

      if (!packageNode) {
        // Just load components without package metadata
        await this.loadComponentsDir(join(packageDir, 'components'));
        return;
      }

      const name = packageNode.getString(0) || '';
      const version = packageNode.getChild('version')?.getString(0) || '0.1.0';
      const description = packageNode.getChild('description')?.getString(0);

      // Load components from package
      const componentsDir = join(packageDir, 'components');
      await this.loadComponentsDir(componentsDir);

      const packageDef: PackageDefinition = {
        name,
        version,
        description,
        components: [], // Will be populated as components are loaded
        filePath: packageFile,
      };

      this.packages.set(name, packageDef);
    } catch (error) {
      // Package file might not exist, try loading components directly
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await this.loadComponentsDir(join(packageDir, 'components'));
      } else {
        throw error;
      }
    }
  }

  /**
   * Load components from a directory
   */
  private async loadComponentsDir(dir: string): Promise<void> {
    try {
      const entries = await readdir(dir);

      for (const entry of entries) {
        const entryPath = join(dir, entry);
        const stats = await stat(entryPath);

        if (stats.isDirectory()) {
          // Component is in its own directory
          await this.loadComponentFromDir(entryPath);
        } else if (extname(entry) === '.kdl' && !entry.includes('.a11y.')) {
          // Single-file component
          await this.loadComponentFile(entryPath);
        }
      }
    } catch (error) {
      // Directory might not exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Load a component from its directory
   */
  private async loadComponentFromDir(componentDir: string): Promise<void> {
    const entries = await readdir(componentDir);
    const kdlFile = entries.find((e) => extname(e) === '.kdl' && !e.includes('.a11y.'));

    if (!kdlFile) {
      return; // No component definition found
    }

    await this.loadComponentFile(join(componentDir, kdlFile));
  }

  /**
   * Load a single component file
   */
  private async loadComponentFile(filePath: string): Promise<void> {
    const kdl = await parseKdlFile(filePath);
    const component = parseComponentKdl(kdl, filePath);
    this.components.set(component.name, component);
  }

  /**
   * Get a component by name
   */
  getComponent(name: string): ComponentDefinition | undefined {
    return this.components.get(name);
  }

  /**
   * Get all loaded components
   */
  getComponents(): ComponentDefinition[] {
    return Array.from(this.components.values());
  }

  /**
   * Get a package by name
   */
  getPackage(name: string): PackageDefinition | undefined {
    return this.packages.get(name);
  }

  /**
   * Get all packages
   */
  getPackages(): PackageDefinition[] {
    return Array.from(this.packages.values());
  }

  /**
   * Check if a component exists
   */
  hasComponent(name: string): boolean {
    return this.components.has(name);
  }

  /**
   * Get component dependencies (transitive)
   */
  getDependencies(componentName: string): string[] {
    const visited = new Set<string>();
    const dependencies: string[] = [];

    const collect = (name: string) => {
      if (visited.has(name)) return;
      visited.add(name);

      const component = this.components.get(name);
      if (!component || !component.dependsOn) return;

      for (const dep of component.dependsOn) {
        if (!visited.has(dep)) {
          dependencies.push(dep);
          collect(dep);
        }
      }
    };

    collect(componentName);
    return dependencies;
  }

  /**
   * Get components sorted by dependencies (topological sort)
   */
  getComponentsInOrder(): ComponentDefinition[] {
    const visited = new Set<string>();
    const result: ComponentDefinition[] = [];

    const visit = (name: string) => {
      if (visited.has(name)) return;
      visited.add(name);

      const component = this.components.get(name);
      if (!component) return;

      // Visit dependencies first
      if (component.dependsOn) {
        for (const dep of component.dependsOn) {
          visit(dep);
        }
      }

      result.push(component);
    };

    for (const name of this.components.keys()) {
      visit(name);
    }

    return result;
  }
}

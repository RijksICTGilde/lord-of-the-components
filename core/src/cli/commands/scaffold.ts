/**
 * Lord of the Components - Scaffold Command
 *
 * Generates RigScript skeleton files from KDL component definitions.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import chalk from 'chalk';
import { ComponentLoader } from '../../loader/component-loader.js';
import type { ComponentDefinition, PropDefinition, SlotDefinition } from '../../types/components.js';

export interface ScaffoldOptions {
  /** Component name to scaffold */
  componentName: string;
  /** Output file path (optional, defaults to component directory) */
  output?: string;
  /** Project root directory */
  projectRoot?: string;
  /** Verbose output */
  verbose?: boolean;
}

/**
 * Check if a prop name is valid (not a description string leaked from KDL)
 */
function isValidPropName(name: string): boolean {
  // Valid prop names don't contain spaces and match typical identifier patterns
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

/**
 * Generate a RigScript skeleton from a component definition
 */
function generateRigScript(component: ComponentDefinition): string {
  const lines: string[] = [];

  // Header comment
  const titleCase = component.name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  lines.push(`# Lord of the Components - ${titleCase} Component Logic`);
  lines.push(`# ${component.description}`);
  lines.push('');

  // Determine the root element tag
  const tag = determineRootTag(component);
  lines.push(`render.element("${tag}"):`);

  // Filter out invalid props (description strings leaked from KDL parsing)
  const validProps = component.props.filter((p) => isValidPropName(p.name));

  // Group props by category
  const coreProps = validProps.filter(
    (p) => !isBooleanProp(p) && !isConditionalProp(p)
  );
  const booleanProps = validProps.filter(
    (p) => isBooleanProp(p) && !isSpecialBooleanProp(p)
  );
  const specialBooleanProps = validProps.filter((p) => isSpecialBooleanProp(p));

  // Core attributes (non-boolean props with defaults or always needed)
  if (coreProps.length > 0) {
    lines.push('    # Core attributes');
    for (const prop of coreProps) {
      lines.push(`    attrs.${prop.name} = props.${prop.name}`);
    }
    lines.push('');
  }

  // State/boolean attributes
  if (booleanProps.length > 0) {
    lines.push('    # State attributes');
    for (const prop of booleanProps) {
      lines.push(`    if props.${prop.name}:`);
      lines.push(`        attrs.${prop.name} = true`);
      lines.push('');
    }
  }

  // Special boolean props (disabled, loading, etc.) with ARIA attributes
  if (specialBooleanProps.length > 0) {
    for (const prop of specialBooleanProps) {
      lines.push(`    if props.${prop.name}:`);
      lines.push(`        attrs.${prop.name} = true`);
      if (prop.name === 'loading') {
        lines.push('        attrs["aria-busy"] = "true"');
      }
      if (prop.name === 'disabled') {
        lines.push('        attrs["aria-disabled"] = "true"');
      }
      lines.push('');
    }
  }

  // Named slots (not default)
  const namedSlots = component.slots.filter((s) => s.name !== 'default');
  for (const slot of namedSlots) {
    lines.push(`    # ${slot.description || `${slot.name} slot`}`);
    if (!slot.required) {
      lines.push(`    if props.${slot.name}:`);
      lines.push(`        render.element("div"):`);
      lines.push(`            attrs.class = "c-${component.name}__${slot.name}"`);
      lines.push(`            render.slot("${slot.name}")`);
    } else {
      lines.push(`    render.element("div"):`);
      lines.push(`        attrs.class = "c-${component.name}__${slot.name}"`);
      lines.push(`        render.slot("${slot.name}")`);
    }
    lines.push('');
  }

  // Default slot
  const defaultSlot = component.slots.find((s) => s.name === 'default');
  if (defaultSlot) {
    lines.push('    # Default content');
    lines.push('    render.slot("default")');
    lines.push('');
  }

  // Remove trailing empty line if present
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  lines.push('');

  return lines.join('\n');
}

/**
 * Determine the root HTML tag for a component
 */
function determineRootTag(component: ComponentDefinition): string {
  const name = component.name.toLowerCase();

  // Common tag mappings by component name
  const tagMappings: Record<string, string> = {
    button: 'button',
    link: 'a',
    input: 'input',
    'input-text': 'input',
    'input-email': 'input',
    'input-password': 'input',
    'input-number': 'input',
    textarea: 'textarea',
    select: 'select',
    form: 'form',
    label: 'label',
    heading: 'h2',
    text: 'p',
    paragraph: 'p',
    image: 'img',
    figure: 'figure',
    list: 'ul',
    'list-item': 'li',
    nav: 'nav',
    navigation: 'nav',
    header: 'header',
    footer: 'footer',
    main: 'main',
    section: 'section',
    article: 'article',
    aside: 'aside',
    table: 'table',
  };

  if (tagMappings[name]) {
    return tagMappings[name];
  }

  // Check if component has href prop (likely a link)
  const hasHref = component.props.some((p) => p.name === 'href');
  if (hasHref) {
    return 'a';
  }

  // Default to div for layout/container components
  return 'div';
}

/**
 * Check if a prop is a boolean type
 */
function isBooleanProp(prop: PropDefinition): boolean {
  return prop.type === 'boolean';
}

/**
 * Check if a prop should be conditionally rendered
 */
function isConditionalProp(prop: PropDefinition): boolean {
  // Props that typically need conditional handling
  const conditionalProps = ['href', 'target', 'icon', 'media'];
  return conditionalProps.includes(prop.name);
}

/**
 * Check if a boolean prop is special (needs ARIA attributes)
 */
function isSpecialBooleanProp(prop: PropDefinition): boolean {
  const specialProps = ['disabled', 'loading', 'expanded', 'selected', 'checked'];
  return prop.type === 'boolean' && specialProps.includes(prop.name);
}

/**
 * Find the output path for a component's .rig file
 */
function findOutputPath(component: ComponentDefinition, projectRoot: string): string {
  // The component filePath points to the .kdl file
  // We want the .rig file in the same directory
  const kdlPath = component.filePath;
  const dir = dirname(kdlPath);
  return join(dir, `${component.name}.rig`);
}

/**
 * Scaffold a .rig file from a KDL component definition
 */
export async function scaffoldComponent(options: ScaffoldOptions): Promise<void> {
  const projectRoot = options.projectRoot || process.cwd();
  const loader = new ComponentLoader(projectRoot);

  if (options.verbose) {
    console.log(chalk.gray(`Loading components from: ${projectRoot}`));
  }

  // Load all components
  await loader.loadAll();

  // Find the requested component
  const component = loader.getComponent(options.componentName);

  if (!component) {
    const allComponents = loader.getComponents();
    const names = allComponents.map((c) => c.name).sort();

    // Find similar names for suggestions
    const similar = names.filter(
      (n) =>
        n.includes(options.componentName) ||
        options.componentName.includes(n) ||
        levenshteinDistance(n, options.componentName) <= 3
    );

    let errorMsg = `Component "${options.componentName}" not found.`;
    if (similar.length > 0) {
      errorMsg += ` Did you mean: ${similar.slice(0, 5).join(', ')}?`;
    } else if (names.length > 0) {
      errorMsg += ` Available components: ${names.slice(0, 10).join(', ')}${names.length > 10 ? '...' : ''}`;
    }

    throw new Error(errorMsg);
  }

  if (options.verbose) {
    console.log(chalk.gray(`Found component: ${component.name}`));
    console.log(chalk.gray(`  Category: ${component.category}`));
    console.log(chalk.gray(`  Props: ${component.props.length}`));
    console.log(chalk.gray(`  Slots: ${component.slots.length}`));
  }

  // Generate RigScript
  const rigScript = generateRigScript(component);

  // Determine output path
  const outputPath = options.output
    ? resolve(process.cwd(), options.output)
    : findOutputPath(component, projectRoot);

  // Ensure output directory exists
  const outputDir = dirname(outputPath);
  await mkdir(outputDir, { recursive: true });

  // Write the file
  await writeFile(outputPath, rigScript, 'utf-8');

  console.log(chalk.green(`Scaffolded: ${component.name}`));
  console.log(chalk.green(`       To: ${outputPath}`));

  if (options.verbose) {
    console.log(chalk.gray('\nGenerated RigScript:'));
    console.log(chalk.gray('---'));
    console.log(rigScript);
    console.log(chalk.gray('---'));
  }
}

/**
 * Simple Levenshtein distance for suggestions
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

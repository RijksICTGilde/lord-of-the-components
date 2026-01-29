/**
 * Lord of the Components - KDL Parser
 *
 * Utilities for parsing KDL files for components, tokens, and themes.
 */

import { readFile } from 'node:fs/promises';
import { parse as parseKdlRaw, type Document, type Node } from 'kdljs';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Parsed KDL document with convenient accessors
 */
export interface ParsedKdl {
  raw: Document;
  nodes: Map<string, KdlNode>;
  getNode(name: string): KdlNode | undefined;
  getNodes(name: string): KdlNode[];
  getString(path: string): string | undefined;
  getBoolean(path: string): boolean | undefined;
  getNumber(path: string): number | undefined;
}

/**
 * Wrapper around a KDL node with convenient methods
 */
export interface KdlNode {
  name: string;
  args: (string | number | boolean | null)[];
  props: Record<string, string | number | boolean | null>;
  children: KdlNode[];
  getChild(name: string): KdlNode | undefined;
  getChildren(name: string): KdlNode[];
  getArg(index: number): string | number | boolean | null | undefined;
  getProp(name: string): string | number | boolean | null | undefined;
  getString(index: number): string | undefined;
  getBoolean(index: number): boolean | undefined;
  getNumber(index: number): number | undefined;
}

// =============================================================================
// IMPLEMENTATION
// =============================================================================

/**
 * Parse KDL source string into a structured document
 */
export function parseKdl(source: string): ParsedKdl {
  const result = parseKdlRaw(source);

  if (!result.output) {
    const errors = result.errors?.map((e) => e.message).join(', ') || 'Unknown parse error';
    throw new Error(`Failed to parse KDL: ${errors}`);
  }

  const doc = result.output;
  const nodes = new Map<string, KdlNode>();

  for (const node of doc) {
    const wrapped = wrapNode(node);
    nodes.set(wrapped.name, wrapped);
  }

  return {
    raw: doc,
    nodes,
    getNode(name: string): KdlNode | undefined {
      return nodes.get(name);
    },
    getNodes(name: string): KdlNode[] {
      return Array.from(nodes.values()).filter((n) => n.name === name);
    },
    getString(path: string): string | undefined {
      const value = getValueByPath(nodes, path);
      return typeof value === 'string' ? value : undefined;
    },
    getBoolean(path: string): boolean | undefined {
      const value = getValueByPath(nodes, path);
      return typeof value === 'boolean' ? value : undefined;
    },
    getNumber(path: string): number | undefined {
      const value = getValueByPath(nodes, path);
      return typeof value === 'number' ? value : undefined;
    },
  };
}

/**
 * Parse KDL file from disk
 */
export async function parseKdlFile(filePath: string): Promise<ParsedKdl> {
  const content = await readFile(filePath, 'utf-8');
  return parseKdl(content);
}

/**
 * Wrap a raw KDL node with convenience methods
 */
function wrapNode(node: Node): KdlNode {
  const children = (node.children || []).map(wrapNode);

  return {
    name: node.name,
    args: node.values || [],
    props: (node.properties || {}) as Record<string, string | number | boolean | null>,
    children,

    getChild(name: string): KdlNode | undefined {
      return children.find((c) => c.name === name);
    },

    getChildren(name: string): KdlNode[] {
      return children.filter((c) => c.name === name);
    },

    getArg(index: number): string | number | boolean | null | undefined {
      return node.values?.[index];
    },

    getProp(name: string): string | number | boolean | null | undefined {
      return node.properties?.[name];
    },

    getString(index: number): string | undefined {
      const val = node.values?.[index];
      return typeof val === 'string' ? val : undefined;
    },

    getBoolean(index: number): boolean | undefined {
      const val = node.values?.[index];
      return typeof val === 'boolean' ? val : undefined;
    },

    getNumber(index: number): number | undefined {
      const val = node.values?.[index];
      return typeof val === 'number' ? val : undefined;
    },
  };
}

/**
 * Get a value from the parsed KDL by dot-separated path
 */
function getValueByPath(
  nodes: Map<string, KdlNode>,
  path: string
): string | number | boolean | null | undefined {
  const parts = path.split('.');
  let current: KdlNode | undefined = nodes.get(parts[0]);

  for (let i = 1; i < parts.length && current; i++) {
    current = current.getChild(parts[i]);
  }

  if (!current) return undefined;

  // Return the first argument if no more path parts
  return current.getArg(0);
}

// =============================================================================
// COMPONENT PARSING
// =============================================================================

import type {
  ComponentDefinition,
  PropDefinition,
  SlotDefinition,
  ComponentExample,
  ComponentStatus,
  ComponentCategory,
  PropType,
} from '../types/components.js';

/**
 * Parse a component definition from KDL
 */
export function parseComponentKdl(kdl: ParsedKdl, filePath: string): ComponentDefinition {
  const componentNode = kdl.getNode('component');
  if (!componentNode) {
    throw new Error('No component node found in KDL');
  }

  const name = componentNode.getString(0);
  if (!name) {
    throw new Error('Component must have a name');
  }

  // Parse basic info
  const description = componentNode.getChild('description')?.getString(0) || '';
  const category = (componentNode.getChild('category')?.getString(0) || 'utility') as ComponentCategory;
  const status = (componentNode.getChild('status')?.getString(0) || 'experimental') as ComponentStatus;

  // Parse dependencies
  const dependsOnNode = componentNode.getChild('depends-on');
  const dependsOn = dependsOnNode ? [dependsOnNode.getString(0)!].filter(Boolean) : undefined;

  // Parse props
  const propsNode = componentNode.getChild('props');
  const props: PropDefinition[] = [];
  if (propsNode) {
    for (const propNode of propsNode.children) {
      props.push(parseProp(propNode));
    }
  }

  // Parse slots
  const slotsNode = componentNode.getChild('slots');
  const slots: SlotDefinition[] = [];
  if (slotsNode) {
    for (const slotNode of slotsNode.children) {
      slots.push({
        name: slotNode.name,
        required: slotNode.getProp('required') === true,
        description: slotNode.getString(0),
      });
    }
  }

  // Parse tokens
  const tokensNode = componentNode.getChild('tokens');
  const tokens: Record<string, string> = {};
  if (tokensNode) {
    for (const tokenNode of tokensNode.children) {
      tokens[tokenNode.name] = tokenNode.getString(0) || '';
    }
  }

  // Parse examples
  const examplesNode = componentNode.getChild('examples');
  const examples: ComponentExample[] = [];
  if (examplesNode) {
    for (const exampleNode of examplesNode.children) {
      if (exampleNode.name === 'example') {
        examples.push(parseExample(exampleNode));
      }
    }
  }

  return {
    name,
    description,
    category,
    status,
    dependsOn,
    props,
    slots,
    tokens,
    examples,
    filePath,
  };
}

function parseProp(node: KdlNode): PropDefinition {
  const type = (node.getProp('type') || 'string') as PropType;
  const required = node.getProp('required') === true;
  const defaultValue = node.getProp('default');

  let enumValues: string[] | undefined;
  const enumNode = node.getChild('enum');
  if (enumNode) {
    enumValues = enumNode.args.filter((a): a is string => typeof a === 'string');
  }

  return {
    name: node.name,
    type,
    required,
    default: defaultValue as string | number | boolean | null | undefined,
    description: node.getString(0),
    enumValues,
  };
}

function parseExample(node: KdlNode): ComponentExample {
  const name = node.getString(0) || 'example';
  const titleNode = node.getChild('title');
  const descriptionNode = node.getChild('description');
  const codeNode = node.getChild('code');

  return {
    name,
    title: titleNode?.getString(0) || name,
    description: descriptionNode?.getString(0),
    code: codeNode?.getString(0) || '',
  };
}

// =============================================================================
// TOKEN PARSING
// =============================================================================

import type { PrimitiveTokens, SemanticSchema, ImplementationTokens } from '../types/tokens.js';

/**
 * Parse primitive tokens from KDL
 */
export function parsePrimitiveTokensKdl(kdl: ParsedKdl): PrimitiveTokens {
  const tokens: PrimitiveTokens = {};

  for (const [name, node] of kdl.nodes) {
    if (name === 'comment') continue;

    tokens[name] = {};
    for (const child of node.children) {
      const childValue = parseTokenValue(child);
      tokens[name][child.name] = childValue;
    }
  }

  return tokens;
}

function parseTokenValue(node: KdlNode): any {
  // Check if this node has children (nested values)
  if (node.children.length > 0) {
    const result: Record<string, any> = {};
    for (const child of node.children) {
      result[child.name] = parseTokenValue(child);
    }
    return result;
  }

  // Get the value and type annotation
  const value = node.getArg(0);
  const type = node.args[0] && typeof node.args[0] === 'string' && node.args[0].startsWith('(')
    ? node.args[0].slice(1, -1)
    : undefined;

  if (value === undefined || value === null) {
    // Check if there's a type annotation with value
    const firstArg = node.args[0];
    if (typeof firstArg === 'string') {
      return { value: firstArg, type };
    }
    return { value: '', type };
  }

  return { value, type };
}

/**
 * Parse semantic schema from KDL
 */
export function parseSemanticSchemaKdl(kdl: ParsedKdl): SemanticSchema {
  const schema: SemanticSchema = {};

  const semanticNode = kdl.getNode('semantic');
  if (!semanticNode) {
    return schema;
  }

  for (const categoryNode of semanticNode.children) {
    const tokenNames: string[] = [];
    for (const tokenNode of categoryNode.children) {
      tokenNames.push(tokenNode.name);
    }
    schema[categoryNode.name] = tokenNames;
  }

  return schema;
}

/**
 * Parse implementation/theme tokens from KDL
 */
export function parseImplementationTokensKdl(kdl: ParsedKdl): { name: string; tokens: ImplementationTokens } {
  // Try both "implementation" and "theme" node names
  const implNode = kdl.getNode('implementation') || kdl.getNode('theme');
  if (!implNode) {
    throw new Error('No implementation or theme node found');
  }

  const name = implNode.getString(0) || 'default';
  const tokens: ImplementationTokens = {};

  const tokensNode = implNode.getChild('tokens') || implNode;
  for (const categoryNode of tokensNode.children) {
    if (categoryNode.name === 'tokens') continue; // Skip if we're iterating implNode directly

    tokens[categoryNode.name] = {};
    for (const tokenNode of categoryNode.children) {
      tokens[categoryNode.name][tokenNode.name] = tokenNode.getString(0) || '';
    }
  }

  return { name, tokens };
}

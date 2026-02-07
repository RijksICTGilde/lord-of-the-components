/**
 * Component Definitions
 *
 * Exports all semantic component definitions.
 */

// Action components
export { button, type ButtonDefinition } from "./button.def.js";

// Navigation components
export { menu, type MenuDefinition } from "./menu.def.js";

// Layout components
export { header, type HeaderDefinition } from "./header.def.js";

// Data display components
export { card, type CardDefinition } from "./card.def.js";

// Typography components
export { heading, type HeadingDefinition } from "./heading.def.js";

// Component registry (for lookups by name)
import { button } from "./button.def.js";
import { menu } from "./menu.def.js";
import { header } from "./header.def.js";
import { card } from "./card.def.js";
import { heading } from "./heading.def.js";
import type { ComponentDefinition } from "../component.js";

export const COMPONENTS: Record<string, ComponentDefinition> = {
  button,
  menu,
  header,
  card,
  heading,
};

/**
 * Get a component definition by name
 */
export function getComponent(name: string): ComponentDefinition | undefined {
  return COMPONENTS[name];
}

/**
 * Check if a component exists
 */
export function hasComponent(name: string): boolean {
  return name in COMPONENTS;
}

/**
 * Get all component names
 */
export function getComponentNames(): string[] {
  return Object.keys(COMPONENTS);
}
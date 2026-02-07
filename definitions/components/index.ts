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
export { layoutFlow, type LayoutFlowDefinition } from "./layout-flow.def.js";
export { layoutColumn, type LayoutColumnDefinition } from "./layout-column.def.js";
export { layoutRow, type LayoutRowDefinition } from "./layout-row.def.js";
export { maxWidthLayout, type MaxWidthLayoutDefinition } from "./max-width-layout.def.js";

// Data display components
export { card, type CardDefinition } from "./card.def.js";

// Typography components
export { heading, type HeadingDefinition } from "./heading.def.js";

// Visual components
export { icon, type IconDefinition } from "./icon.def.js";

// Component registry (for lookups by name)
import { button } from "./button.def.js";
import { menu } from "./menu.def.js";
import { header } from "./header.def.js";
import { card } from "./card.def.js";
import { heading } from "./heading.def.js";
import { icon } from "./icon.def.js";
import { layoutFlow } from "./layout-flow.def.js";
import { layoutColumn } from "./layout-column.def.js";
import { layoutRow } from "./layout-row.def.js";
import { maxWidthLayout } from "./max-width-layout.def.js";
import type { ComponentDefinition } from "../component.js";

export const COMPONENTS: Record<string, ComponentDefinition> = {
  button,
  menu,
  header,
  card,
  heading,
  icon,
  "layout-flow": layoutFlow,
  "layout-column": layoutColumn,
  "layout-row": layoutRow,
  "max-width-layout": maxWidthLayout,
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
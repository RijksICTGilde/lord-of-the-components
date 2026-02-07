/**
 * Component Definitions
 *
 * Exports all semantic component definitions.
 */
export { button, type ButtonDefinition } from "./button.def.js";
export { menu, type MenuDefinition } from "./menu.def.js";
export { header, type HeaderDefinition } from "./header.def.js";
export { page, type PageDefinition } from "./page.def.js";
export { layoutFlow, type LayoutFlowDefinition } from "./layout-flow.def.js";
export { layoutColumn, type LayoutColumnDefinition } from "./layout-column.def.js";
export { layoutRow, type LayoutRowDefinition } from "./layout-row.def.js";
export { maxWidthLayout, type MaxWidthLayoutDefinition } from "./max-width-layout.def.js";
export { grid, type GridDefinition } from "./grid.def.js";
export { card, type CardDefinition } from "./card.def.js";
export { heading, type HeadingDefinition } from "./heading.def.js";
export { paragraph, type ParagraphDefinition } from "./paragraph.def.js";
export { link, type LinkDefinition } from "./link.def.js";
export { label, type LabelDefinition } from "./label.def.js";
export { strong, type StrongDefinition } from "./strong.def.js";
export { em, type EmDefinition } from "./em.def.js";
export { icon, type IconDefinition } from "./icon.def.js";
import type { ComponentDefinition } from "../component.js";
export declare const COMPONENTS: Record<string, ComponentDefinition>;
/**
 * Get a component definition by name
 */
export declare function getComponent(name: string): ComponentDefinition | undefined;
/**
 * Check if a component exists
 */
export declare function hasComponent(name: string): boolean;
/**
 * Get all component names
 */
export declare function getComponentNames(): string[];
//# sourceMappingURL=index.d.ts.map
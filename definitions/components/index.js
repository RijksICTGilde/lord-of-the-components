/**
 * Component Definitions
 *
 * Exports all semantic component definitions.
 */
// Action components
export { button } from "./button.def.js";
// Navigation components
export { menu } from "./menu.def.js";
// Layout components
export { header } from "./header.def.js";
export { page } from "./page.def.js";
export { layoutFlow } from "./layout-flow.def.js";
export { layoutColumn } from "./layout-column.def.js";
export { layoutRow } from "./layout-row.def.js";
export { maxWidthLayout } from "./max-width-layout.def.js";
export { grid } from "./grid.def.js";
// Data display components
export { card } from "./card.def.js";
// Typography components
export { heading } from "./heading.def.js";
export { paragraph } from "./paragraph.def.js";
export { link } from "./link.def.js";
export { label } from "./label.def.js";
export { strong } from "./strong.def.js";
export { em } from "./em.def.js";
// Visual components
export { icon } from "./icon.def.js";
// Component registry (for lookups by name)
import { button } from "./button.def.js";
import { menu } from "./menu.def.js";
import { header } from "./header.def.js";
import { page } from "./page.def.js";
import { card } from "./card.def.js";
import { heading } from "./heading.def.js";
import { icon } from "./icon.def.js";
import { layoutFlow } from "./layout-flow.def.js";
import { layoutColumn } from "./layout-column.def.js";
import { layoutRow } from "./layout-row.def.js";
import { maxWidthLayout } from "./max-width-layout.def.js";
import { grid } from "./grid.def.js";
import { paragraph } from "./paragraph.def.js";
import { link } from "./link.def.js";
import { label } from "./label.def.js";
import { strong } from "./strong.def.js";
import { em } from "./em.def.js";
export const COMPONENTS = {
    button,
    menu,
    header,
    page,
    card,
    heading,
    icon,
    "layout-flow": layoutFlow,
    "layout-column": layoutColumn,
    "layout-row": layoutRow,
    "max-width-layout": maxWidthLayout,
    grid,
    paragraph,
    link,
    label,
    strong,
    em,
};
/**
 * Get a component definition by name
 */
export function getComponent(name) {
    return COMPONENTS[name];
}
/**
 * Check if a component exists
 */
export function hasComponent(name) {
    return name in COMPONENTS;
}
/**
 * Get all component names
 */
export function getComponentNames() {
    return Object.keys(COMPONENTS);
}
//# sourceMappingURL=index.js.map
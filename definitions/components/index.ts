/**
 * Component Definitions
 *
 * Exports all semantic component definitions.
 */

// Action components
export { button, type ButtonDefinition } from "./button.def.js";

// Navigation components
export { breadcrumbs, type BreadcrumbsDefinition } from "./breadcrumbs.def.js";
export { menu, type MenuDefinition } from "./menu.def.js";

// Layout components
export { footer, type FooterDefinition } from "./footer.def.js";
export { header, type HeaderDefinition } from "./header.def.js";
export { hero, type HeroDefinition } from "./hero.def.js";
export { page, type PageDefinition } from "./page.def.js";
export { layoutFlow, type LayoutFlowDefinition } from "./layout-flow.def.js";
export { layoutColumn, type LayoutColumnDefinition } from "./layout-column.def.js";
export { layoutRow, type LayoutRowDefinition } from "./layout-row.def.js";
export { maxWidthLayout, type MaxWidthLayoutDefinition } from "./max-width-layout.def.js";
export { grid, type GridDefinition } from "./grid.def.js";
export { autoGrid, type AutoGridDefinition } from "./auto-grid.def.js";
export { appShell, type AppShellDefinition } from "./app-shell.def.js";
export { stack, type StackDefinition } from "./stack.def.js";
export { columns, type ColumnsDefinition } from "./columns.def.js";

// Data display components
export { card, type CardDefinition } from "./card.def.js";
export { dataList, type DataListDefinition } from "./data-list.def.js";
export { table, type TableDefinition } from "./table.def.js";
export { tableHead, type TableHeadDefinition } from "./table-head.def.js";
export { tableRow, type TableRowDefinition } from "./table-row.def.js";
export { th, type ThDefinition } from "./th.def.js";
export { td, type TdDefinition } from "./td.def.js";
export { accordion, type AccordionDefinition } from "./accordion.def.js";
export { accordionItem, type AccordionItemDefinition } from "./accordion-item.def.js";

// Application/dashboard components (global defs; theme-specific impls)
export {
  metric,
  sidenav,
  sidenavGroup,
  sidenavItem,
  layer,
  sectionHead,
  activity,
  activityItem,
  shortcut,
  chip,
  identity,
  action,
  detailList,
  detailItem,
  sectionLink,
  notification,
  notificationItem,
  catalogCard,
  filterBar,
  filterSelect,
  siteFooter,
} from "./app-components.def.js";

// Feedback components
export { alert, type AlertDefinition } from "./alert.def.js";
export { statusBar, type StatusBarDefinition } from "./status-bar.def.js";
export { tag, type TagDefinition } from "./tag.def.js";
export { badge, type BadgeDefinition } from "./badge.def.js";
export { tabs, type TabsDefinition } from "./tabs.def.js";
export { tab, type TabDefinition } from "./tab.def.js";

// Typography components
export { heading, type HeadingDefinition } from "./heading.def.js";
export { paragraph, type ParagraphDefinition } from "./paragraph.def.js";
export { link, type LinkDefinition } from "./link.def.js";
export { label, type LabelDefinition } from "./label.def.js";
export { strong, type StrongDefinition } from "./strong.def.js";
export { em, type EmDefinition } from "./em.def.js";

// Form components (F9)
export { textInput, type TextInputDefinition } from "./text-input.def.js";
export { textarea, type TextareaDefinition } from "./textarea.def.js";
export { checkbox, type CheckboxDefinition } from "./checkbox.def.js";
export { radio, type RadioDefinition } from "./radio.def.js";
export { select, type SelectDefinition } from "./select.def.js";
export { option, type OptionDefinition } from "./option.def.js";

// Layout primitives (opt-in lotc-layout design system)
export { center, cluster, sidebar, switcher, cover, box, bar, layout } from "./layout-primitives.def.js";

// Visual components
export { icon, type IconDefinition } from "./icon.def.js";

// Component registry (for lookups by name)
import { button } from "./button.def.js";
import { breadcrumbs } from "./breadcrumbs.def.js";
import { menu } from "./menu.def.js";
import { footer } from "./footer.def.js";
import { header } from "./header.def.js";
import { hero } from "./hero.def.js";
import { page } from "./page.def.js";
import { card } from "./card.def.js";
import { dataList } from "./data-list.def.js";
import { heading } from "./heading.def.js";
import { icon } from "./icon.def.js";
import { layoutFlow } from "./layout-flow.def.js";
import { layoutColumn } from "./layout-column.def.js";
import { layoutRow } from "./layout-row.def.js";
import { maxWidthLayout } from "./max-width-layout.def.js";
import { grid } from "./grid.def.js";
import { autoGrid } from "./auto-grid.def.js";
import { appShell } from "./app-shell.def.js";
import { stack } from "./stack.def.js";
import { columns as columnsLayout } from "./columns.def.js";
import { paragraph } from "./paragraph.def.js";
import { link } from "./link.def.js";
import { label } from "./label.def.js";
import { strong } from "./strong.def.js";
import { em } from "./em.def.js";
import { alert } from "./alert.def.js";
import { statusBar } from "./status-bar.def.js";
// Basic HTML elements (F9, batch D)
import { div } from "./div.def.js";
import { span } from "./span.def.js";
import { small } from "./small.def.js";
import { b } from "./b.def.js";
import { i } from "./i.def.js";
import { code } from "./code.def.js";
import { blockquote } from "./blockquote.def.js";
import { hr } from "./hr.def.js";
import { textInput } from "./text-input.def.js";
import { textarea } from "./textarea.def.js";
import { checkbox } from "./checkbox.def.js";
import { radio } from "./radio.def.js";
import { select } from "./select.def.js";
import { option } from "./option.def.js";
import { tag } from "./tag.def.js";
import { badge } from "./badge.def.js";
import { tabs } from "./tabs.def.js";
import { tab } from "./tab.def.js";
import { table } from "./table.def.js";
import { tableHead } from "./table-head.def.js";
import { tableRow } from "./table-row.def.js";
import { th } from "./th.def.js";
import { td } from "./td.def.js";
import { accordion } from "./accordion.def.js";
import { accordionItem } from "./accordion-item.def.js";
import {
  metric,
  sidenav,
  sidenavGroup,
  sidenavItem,
  layer,
  sectionHead,
  activity,
  activityItem,
  shortcut,
  chip,
  identity,
  action,
  detailList,
  detailItem,
  sectionLink,
  notification,
  notificationItem,
  catalogCard,
  filterBar,
  filterSelect,
  siteFooter,
} from "./app-components.def.js";
import { center, cluster, sidebar, switcher, cover, box, bar, layout } from "./layout-primitives.def.js";
import type { ComponentDefinition } from "../component.js";

export const COMPONENTS: Record<string, ComponentDefinition> = {
  button,
  breadcrumbs,
  menu,
  footer,
  header,
  hero,
  page,
  card,
  "data-list": dataList,
  heading,
  icon,
  "layout-flow": layoutFlow,
  "layout-column": layoutColumn,
  "layout-row": layoutRow,
  "max-width-layout": maxWidthLayout,
  grid,
  "auto-grid": autoGrid,
  "app-shell": appShell,
  stack,
  columns: columnsLayout,
  paragraph,
  link,
  label,
  strong,
  em,
  alert,
  statusBar,
  div,
  span,
  small,
  b,
  i,
  code,
  blockquote,
  hr,
  "text-input": textInput,
  textarea,
  checkbox,
  radio,
  select,
  option,
  tag,
  badge,
  tabs,
  tab,
  table,
  "table-head": tableHead,
  "table-row": tableRow,
  th,
  td,
  accordion,
  "accordion-item": accordionItem,
  metric,
  sidenav,
  "sidenav-group": sidenavGroup,
  "sidenav-item": sidenavItem,
  layer,
  "section-head": sectionHead,
  activity,
  "activity-item": activityItem,
  shortcut,
  chip,
  identity,
  action,
  "detail-list": detailList,
  "detail-item": detailItem,
  "section-link": sectionLink,
  notification,
  "notification-item": notificationItem,
  "catalog-card": catalogCard,
  "filter-bar": filterBar,
  "filter-select": filterSelect,
  "site-footer": siteFooter,
  center,
  cluster,
  sidebar,
  switcher,
  cover,
  box,
  bar,
  layout,
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
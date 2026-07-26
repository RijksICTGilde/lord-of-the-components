/**
 * Lord of the Components - Definition System
 *
 * This module exports all dictionaries and helpers for defining semantic components.
 */

// Dictionaries
export { PROPS, type PropName, isPropName } from "./props.js";
export {
  VALUES,
  type ValueOf,
  type ButtonType,
  type MenuType,
  type StatusType,
  type Size,
  type Direction,
  type Alignment,
  type IconPosition,
  type ButtonHtmlType,
  type LinkTarget,
  type HeadingLevel,
  isValueOf,
} from "./values.js";
export {
  EVENTS,
  EVENT_GROUPS,
  type EventName,
  isEventName,
  getEventSyntax,
} from "./events.js";
export {
  BINDINGS,
  type BindingType,
  type BindingTypeMap,
  type MenuItem,
  type SelectOption,
  type ProgressStep,
  type BreadcrumbItem,
  type TableColumn,
  type TableRow,
  type TabItem,
} from "./bindings.js";

// Component definition system
export {
  defineComponent,
  type ComponentDefinition,
  type ChildComponentDefinition,
  type PropDefinition,
  type PropSpec,
  type ContentDefinition,
  type ComponentProps,
  type ComponentEvents,
  type ComponentBindings,
  hasComponentProp,
  hasComponentEvent,
  getPropValues,
  isBooleanProp,
  getComponentTagName,
} from "./component.js";
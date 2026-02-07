/**
 * Implementation System
 *
 * Re-exports the implementation framework and all component implementations.
 */

// Framework
export {
  defineImplementation,
  isConditionalClass,
  isPatternClass,
  type StaticClass,
  type ConditionalClass,
  type PatternClass,
  type ClassRule,
  type AttributeMapping,
  type ContentBlock,
  type DynamicElement,
  type ComponentImplementation,
} from "./implementation.js";

// Component implementations
export { buttonImpl, headingImpl } from "./components/index.js";

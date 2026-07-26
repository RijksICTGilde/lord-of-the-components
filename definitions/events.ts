/**
 * EVENTS - All allowed event names
 *
 * These are the event names that can be bound to components using the @ prefix.
 * Example: <c-button @click="handleClick()"/>
 *
 * Components declare which events they support, and the system validates
 * that only supported events are used.
 */

export const EVENTS = {
  // ═══════════════════════════════════════════════════════════════════════════
  // MOUSE EVENTS
  // ═══════════════════════════════════════════════════════════════════════════
  CLICK: "click",
  DBLCLICK: "dblclick",
  MOUSEDOWN: "mousedown",
  MOUSEUP: "mouseup",
  MOUSEENTER: "mouseenter",
  MOUSELEAVE: "mouseleave",
  MOUSEOVER: "mouseover",
  MOUSEOUT: "mouseout",
  CONTEXTMENU: "contextmenu",

  // ═══════════════════════════════════════════════════════════════════════════
  // KEYBOARD EVENTS
  // ═══════════════════════════════════════════════════════════════════════════
  KEYDOWN: "keydown",
  KEYUP: "keyup",
  KEYPRESS: "keypress",

  // ═══════════════════════════════════════════════════════════════════════════
  // FOCUS EVENTS
  // ═══════════════════════════════════════════════════════════════════════════
  FOCUS: "focus",
  BLUR: "blur",
  FOCUSIN: "focusin",
  FOCUSOUT: "focusout",

  // ═══════════════════════════════════════════════════════════════════════════
  // FORM EVENTS
  // ═══════════════════════════════════════════════════════════════════════════
  CHANGE: "change",
  INPUT: "input",
  SUBMIT: "submit",
  RESET: "reset",
  INVALID: "invalid",

  // ═══════════════════════════════════════════════════════════════════════════
  // TOUCH EVENTS
  // ═══════════════════════════════════════════════════════════════════════════
  TOUCHSTART: "touchstart",
  TOUCHEND: "touchend",
  TOUCHMOVE: "touchmove",
  TOUCHCANCEL: "touchcancel",

  // ═══════════════════════════════════════════════════════════════════════════
  // DRAG EVENTS
  // ═══════════════════════════════════════════════════════════════════════════
  DRAG: "drag",
  DRAGSTART: "dragstart",
  DRAGEND: "dragend",
  DRAGENTER: "dragenter",
  DRAGLEAVE: "dragleave",
  DRAGOVER: "dragover",
  DROP: "drop",

  // ═══════════════════════════════════════════════════════════════════════════
  // CUSTOM SEMANTIC EVENTS
  // These are component-specific events that map to actual DOM events
  // ═══════════════════════════════════════════════════════════════════════════
  TOGGLE: "toggle",
  OPEN: "open",
  CLOSE: "close",
  SELECT: "select",
  DISMISS: "dismiss",
  CONFIRM: "confirm",
  CANCEL: "cancel",
  EXPAND: "expand",
  COLLAPSE: "collapse",
  SORT: "sort",
  FILTER: "filter",
  SEARCH: "search",
  PAGINATE: "paginate",
  LOAD: "load",
  ERROR: "error",
} as const;

// Type for event names
export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

// Event groups for component declaration
export const EVENT_GROUPS = {
  // Common interactive events
  INTERACTIVE: [EVENTS.CLICK, EVENTS.FOCUS, EVENTS.BLUR] as const,

  // Form input events
  FORM_INPUT: [
    EVENTS.CHANGE,
    EVENTS.INPUT,
    EVENTS.FOCUS,
    EVENTS.BLUR,
    EVENTS.INVALID,
  ] as const,

  // Full keyboard support
  KEYBOARD: [EVENTS.KEYDOWN, EVENTS.KEYUP, EVENTS.KEYPRESS] as const,

  // Mouse hover
  HOVER: [EVENTS.MOUSEENTER, EVENTS.MOUSELEAVE] as const,

  // Overlay/modal events
  OVERLAY: [EVENTS.OPEN, EVENTS.CLOSE, EVENTS.DISMISS] as const,

  // Menu/selection events
  SELECTION: [EVENTS.SELECT, EVENTS.CHANGE] as const,

  // Expandable content
  EXPANDABLE: [EVENTS.TOGGLE, EVENTS.EXPAND, EVENTS.COLLAPSE] as const,
} as const;

// Type guard to check if a string is a valid event name
export function isEventName(value: string): value is EventName {
  return Object.values(EVENTS).includes(value as EventName);
}

// Helper to get the @ prefixed event syntax
export function getEventSyntax(event: EventName): string {
  return `@${event}`;
}
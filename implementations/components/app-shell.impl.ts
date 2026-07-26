/** App-shell — header/sidebar/main/footer via named grid areas.
 * Theme-agnostic structural layout (see static/lotc/layout.css). Chrome regions
 * come from named slots; the body is the main region. Jinja backend (named
 * slots + styles), one template shared by RVO and NLDD. */
import { defineImplementation } from "../implementation.js";
import { appShell } from "../../definitions/components/app-shell.def.js";

export const appShellImpl = defineImplementation({
  component: appShell,
  root: {
    element: "div",
    isRoot: true,
    classes: [
      "lotc-app-shell",
      { prop: "direction", eq: "right", class: "lotc-app-shell--sidebar-right" },
    ],
    styles: [{ property: "--lotc-sidebar-width", prop: "width" }],
    children: [
      {
        element: "header",
        classes: ["lotc-app-shell__header"],
        when: { prop: "slots.header" },
        text: { slot: "header" },
      },
      {
        element: "aside",
        classes: ["lotc-app-shell__sidebar"],
        when: { prop: "slots.sidebar" },
        text: { slot: "sidebar" },
      },
      {
        element: "main",
        classes: ["lotc-app-shell__main"],
        text: { content: true },
      },
      {
        element: "footer",
        classes: ["lotc-app-shell__footer"],
        when: { prop: "slots.footer" },
        text: { slot: "footer" },
      },
    ],
  },
  mixins: { genericAttributes: true },
});

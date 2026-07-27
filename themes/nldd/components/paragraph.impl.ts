/** NLDD Paragraph — <nldd-rich-text><p>…</p></nldd-rich-text>. NLDD renders body
 * copy through its rich-text component (typography + tight, title-flush spacing),
 * not a bare <p> with browser-default margins. */
import { defineImplementation } from "../../../implementations/implementation.js";
import { paragraph } from "../../../definitions/components/paragraph.def.js";

export const paragraphImpl = defineImplementation({
  component: paragraph,
  root: {
    element: "nldd-rich-text",
    isRoot: true,
    attributes: [{ attr: "spacing", type: "static", value: "snug" }],
    children: [
      { element: "p", text: { coalesce: [{ content: true }, { prop: "label" }] } },
    ],
  },
  mixins: { genericAttributes: true },
});

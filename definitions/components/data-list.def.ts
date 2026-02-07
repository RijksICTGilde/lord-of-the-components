/**
 * Data List Component Definition
 *
 * Key-value pair display using a definition list (<dl>).
 *
 * Usage:
 *   <c-data-list>
 *     <dt class="rvo-data-list__term">Label</dt>
 *     <dd class="rvo-data-list__description">Value</dd>
 *   </c-data-list>
 */

import { defineComponent } from "../component.js";
import { PROPS } from "../props.js";

export const dataList = defineComponent({
  name: "data-list",
  description: "Key-value pair display using a definition list",
  category: "data-display",

  props: {
    /**
     * Additional CSS classes
     */
    [PROPS.CLASS]: {
      description: "Additional CSS classes",
    },
  },

  content: {
    allowed: true,
    description: "Definition list content (dt/dd pairs)",
  },
});

export type DataListDefinition = typeof dataList;

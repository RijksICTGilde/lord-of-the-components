# Prop Dictionary

> Central definition of all props used across components. When a component uses a prop, it references this dictionary for consistent naming, types, and documentation.

## How It Works

```kdl
// In prop-dictionary.kdl
prop "variant" {
    type "generic-color"
    default "primary"
    description "Visual style variant"
    applies-to "buttons" "badges" "alerts" "cards"
}

// In component definition
component "button" {
    props {
        use "variant"           // Gets type, default, description from dictionary
        use "size"
        use "disabled"
        icon type="string"      // Component-specific prop
    }
}
```

---

## Generic Props (Styling)

### `variant`
- **Type**: `generic-color` (primary, secondary, success, warning, error, info)
- **Default**: `primary`
- **Description**: Visual style variant that determines the component's color scheme
- **Used by**: button, badge, alert, card, tag, chip

### `size`
- **Type**: `generic-size` (xs, sm, md, lg, xl)
- **Default**: `md`
- **Description**: Size of the component
- **Used by**: button, input, select, avatar, icon, badge

### `color`
- **Type**: `generic-color`
- **Default**: none
- **Description**: Explicit color override (when variant isn't appropriate)
- **Used by**: icon, text, divider

---

## State Props

### `disabled`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Prevents user interaction and shows disabled visual state
- **Used by**: button, input, select, checkbox, radio, switch

### `loading`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Shows loading indicator and may disable interaction
- **Used by**: button, card, table, form

### `readonly`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Allows viewing but not editing the value
- **Used by**: input, textarea, select

### `required`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Marks field as required for form submission
- **Used by**: input, textarea, select, checkbox, radio

### `invalid`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Indicates validation error state
- **Used by**: input, textarea, select, form-field

### `checked`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether the item is selected/checked
- **Used by**: checkbox, radio, switch

### `open`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether the component is expanded/open
- **Used by**: accordion, dropdown, modal, drawer, popover, details

### `active`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether the item is currently active/selected
- **Used by**: nav-item, tab, menu-item, step

### `selected`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether the item is selected (in a list/grid)
- **Used by**: list-item, card, table-row, option

---

## Content Props

### `label`
- **Type**: `string`
- **Default**: none
- **Description**: Text label for the component
- **Used by**: input, select, checkbox, radio, button, form-field

### `placeholder`
- **Type**: `string`
- **Default**: none
- **Description**: Placeholder text when empty
- **Used by**: input, textarea, select

### `value`
- **Type**: `string | number | boolean`
- **Default**: none
- **Description**: Current value of the input
- **Used by**: input, textarea, select, checkbox, radio, range

### `name`
- **Type**: `string`
- **Default**: none
- **Description**: Form field name for submission
- **Used by**: input, textarea, select, checkbox, radio

### `title`
- **Type**: `string`
- **Default**: none
- **Description**: Title text (heading)
- **Used by**: card, modal, drawer, page, section, alert

### `description`
- **Type**: `string`
- **Default**: none
- **Description**: Descriptive/helper text
- **Used by**: card, form-field, tooltip, alert

### `icon`
- **Type**: `string`
- **Default**: none
- **Description**: Icon name to display
- **Used by**: button, input, menu-item, alert, badge, nav-item

### `iconPosition`
- **Type**: `enum` (before, after)
- **Default**: `before`
- **Description**: Position of icon relative to content
- **Used by**: button, input, menu-item

### `src`
- **Type**: `string`
- **Default**: none
- **Description**: Source URL for media
- **Used by**: image, avatar, video, audio

### `alt`
- **Type**: `string`
- **Default**: none
- **Description**: Alternative text for accessibility
- **Used by**: image, avatar

### `href`
- **Type**: `string`
- **Default**: none
- **Description**: Link destination URL
- **Used by**: link, button, nav-item, menu-item, breadcrumb-item

---

## Layout Props

### `direction`
- **Type**: `enum` (horizontal, vertical)
- **Default**: varies
- **Description**: Layout direction
- **Used by**: stack, button-group, tabs, nav

### `gap`
- **Type**: `generic-size`
- **Default**: `md`
- **Description**: Spacing between child elements
- **Used by**: stack, grid, button-group, form

### `align`
- **Type**: `enum` (start, center, end, stretch, baseline)
- **Default**: `stretch`
- **Description**: Cross-axis alignment
- **Used by**: stack, grid, layout

### `justify`
- **Type**: `enum` (start, center, end, space-between, space-around, space-evenly)
- **Default**: `start`
- **Description**: Main-axis alignment
- **Used by**: stack, grid, layout

### `wrap`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether items wrap to next line
- **Used by**: stack, grid, button-group

### `cols`
- **Type**: `number | string`
- **Default**: varies
- **Description**: Number of columns
- **Used by**: grid, table

### `span`
- **Type**: `number`
- **Default**: `1`
- **Description**: Number of columns/rows to span
- **Used by**: grid-item, table-cell

### `fullWidth`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Stretch to full container width
- **Used by**: button, input, card, divider

### `padding`
- **Type**: `generic-size`
- **Default**: varies
- **Description**: Internal padding
- **Used by**: card, section, container, layout

---

## Behavior Props

### `type`
- **Type**: `enum`
- **Default**: varies
- **Description**: HTML type or behavior variant
- **Used by**: button (button/submit/reset), input (text/email/password/etc)

### `target`
- **Type**: `enum` (_self, _blank, _parent, _top)
- **Default**: `_self`
- **Description**: Link target behavior
- **Used by**: link, button (when href), nav-item

### `closable`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Shows close button
- **Used by**: alert, modal, drawer, tag, notification

### `dismissible`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Can be dismissed by user
- **Used by**: alert, notification, banner

### `autofocus`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Focus on mount
- **Used by**: input, textarea, button, modal

### `autocomplete`
- **Type**: `string`
- **Default**: none
- **Description**: Browser autocomplete hint
- **Used by**: input, textarea, form

---

## Data Props (Dynamic)

### `items`
- **Type**: `array<object>`
- **Default**: `[]`
- **Description**: Array of items to render
- **Used by**: select, menu, nav, tabs, list, table, breadcrumb
- **Structure**: `[{label, value, href?, icon?, disabled?, children?}]`

### `columns`
- **Type**: `array<object>`
- **Default**: `[]`
- **Description**: Table column definitions
- **Used by**: table
- **Structure**: `[{key, label, sortable?, width?}]`

### `options`
- **Type**: `array<object>`
- **Default**: `[]`
- **Description**: Available options to choose from
- **Used by**: select, radio-group, checkbox-group
- **Structure**: `[{label, value, disabled?}]`

### `steps`
- **Type**: `array<object>`
- **Default**: `[]`
- **Description**: Progress/wizard steps
- **Used by**: progress-tracker, stepper
- **Structure**: `[{label, state: pending|current|complete|error}]`

---

## Accessibility Props

### `id`
- **Type**: `string`
- **Default**: auto-generated
- **Description**: Unique identifier for label association
- **Used by**: all form elements

### `ariaLabel`
- **Type**: `string`
- **Default**: none
- **Description**: Accessible label when visual label isn't sufficient
- **Used by**: icon-button, icon, progress

### `ariaDescribedby`
- **Type**: `string`
- **Default**: none
- **Description**: ID of element that describes this component
- **Used by**: input, form-field

### `role`
- **Type**: `string`
- **Default**: semantic
- **Description**: ARIA role override
- **Used by**: various when semantic HTML isn't sufficient

---

## Event Props (for frameworks that support them)

### `@click`
- **Description**: Click/tap handler
- **Used by**: button, link, card, menu-item

### `@change`
- **Description**: Value change handler
- **Used by**: input, select, checkbox, radio

### `@input`
- **Description**: Real-time input handler
- **Used by**: input, textarea

### `@submit`
- **Description**: Form submit handler
- **Used by**: form

### `@close`
- **Description**: Close/dismiss handler
- **Used by**: modal, drawer, alert

### `@open`
- **Description**: Open handler
- **Used by**: dropdown, modal, accordion

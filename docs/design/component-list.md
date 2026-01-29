# Component List

> Complete list of components to implement, organized by category. Each component references props from the [Prop Dictionary](./prop-dictionary.md).

## Legend

- **Props**: References to prop dictionary (use "prop-name")
- **Specific Props**: Props unique to this component
- **Slots**: Named content slots
- **HTML**: Target HTML output structure

---

## Layout Components

### `c-page`
Bootstrap component that wraps entire page.

| Aspect | Definition |
|--------|------------|
| **Props** | title, description, lang (default: "en"), charset (default: "utf-8") |
| **Specific** | theme, head (extra head content), bodyClass |
| **Slots** | default (page content) |
| **HTML** | `<!DOCTYPE html><html><head>...</head><body>{slot}</body></html>` |

### `c-layout`
Main page layout with regions.

| Aspect | Definition |
|--------|------------|
| **Props** | padding, gap |
| **Specific** | variant (default, sidebar-left, sidebar-right, holy-grail), maxWidth (sm/md/lg/xl/full), sidebarWidth |
| **Slots** | default, header, footer, sidebar, sidebar-right |
| **HTML** | Grid-based layout with semantic regions |

### `c-container`
Centered container with max-width.

| Aspect | Definition |
|--------|------------|
| **Props** | padding |
| **Specific** | maxWidth (sm/md/lg/xl/full), centered (boolean) |
| **Slots** | default |
| **HTML** | `<div class="container">{slot}</div>` |

### `c-stack`
Flexbox stack for vertical/horizontal layouts.

| Aspect | Definition |
|--------|------------|
| **Props** | direction, gap, align, justify, wrap |
| **Specific** | reverse, dividers (boolean - show dividers between items) |
| **Slots** | default |
| **HTML** | `<div class="stack">{slot}</div>` |

### `c-grid`
CSS Grid layout.

| Aspect | Definition |
|--------|------------|
| **Props** | cols, gap, align, justify |
| **Specific** | rows, minItemWidth, autoFit, autoFill |
| **Slots** | default |
| **HTML** | `<div class="grid">{slot}</div>` |

### `c-grid-item`
Grid item with span control.

| Aspect | Definition |
|--------|------------|
| **Props** | span |
| **Specific** | colSpan, rowSpan, colStart, rowStart |
| **Slots** | default |
| **HTML** | `<div class="grid-item">{slot}</div>` |

### `c-section`
Semantic page section.

| Aspect | Definition |
|--------|------------|
| **Props** | title, padding |
| **Specific** | level (h2/h3/h4), background (surface/muted/accent) |
| **Slots** | default, header, footer |
| **HTML** | `<section><h2>{title}</h2>{slot}</section>` |

### `c-divider`
Visual separator.

| Aspect | Definition |
|--------|------------|
| **Props** | color |
| **Specific** | orientation (horizontal/vertical), spacing (generic-size), label (text in middle) |
| **Slots** | none |
| **HTML** | `<hr class="divider">` or `<div role="separator">` |

### `c-spacer`
Empty space.

| Aspect | Definition |
|--------|------------|
| **Props** | size |
| **Specific** | grow (boolean - flex-grow: 1) |
| **Slots** | none |
| **HTML** | `<div class="spacer"></div>` |

---

## Actions

### `c-button`
Interactive button.

| Aspect | Definition |
|--------|------------|
| **Props** | variant, size, disabled, loading, icon, iconPosition, fullWidth, type, href, target |
| **Specific** | outline (boolean), rounded (boolean) |
| **Slots** | default (label) |
| **HTML** | `<button>` or `<a>` if href |

### `c-button-group`
Group of related buttons.

| Aspect | Definition |
|--------|------------|
| **Props** | size, direction, gap |
| **Specific** | attached (boolean - no gap, connected borders) |
| **Slots** | default (buttons) |
| **HTML** | `<div class="button-group" role="group">{slot}</div>` |

### `c-icon-button`
Button with only icon.

| Aspect | Definition |
|--------|------------|
| **Props** | variant, size, disabled, icon, ariaLabel, href, target |
| **Specific** | rounded (boolean) |
| **Slots** | none |
| **HTML** | `<button aria-label="...">{icon}</button>` |

### `c-link`
Text link.

| Aspect | Definition |
|--------|------------|
| **Props** | href, target, disabled |
| **Specific** | external (boolean - shows external icon), underline (always/hover/none) |
| **Slots** | default (text) |
| **HTML** | `<a href="...">{slot}</a>` |

---

## Form Inputs

### `c-input`
Text input field.

| Aspect | Definition |
|--------|------------|
| **Props** | label, placeholder, value, name, disabled, readonly, required, invalid, type, icon, iconPosition, id, autofocus, autocomplete |
| **Specific** | inputType (text/email/password/tel/url/search/number), prefix, suffix, clearable (boolean), maxLength, min, max, step, pattern |
| **Slots** | prefix, suffix, helper, error |
| **HTML** | `<div class="input-wrapper"><label>...</label><input></div>` |

### `c-textarea`
Multi-line text input.

| Aspect | Definition |
|--------|------------|
| **Props** | label, placeholder, value, name, disabled, readonly, required, invalid, id, autofocus |
| **Specific** | rows, maxLength, resize (none/vertical/horizontal/both), autoGrow |
| **Slots** | helper, error |
| **HTML** | `<div><label>...</label><textarea></textarea></div>` |

### `c-select`
Dropdown selection.

| Aspect | Definition |
|--------|------------|
| **Props** | label, placeholder, value, name, disabled, required, invalid, items, id |
| **Specific** | multiple (boolean), searchable (boolean), clearable (boolean), optionLabel, optionValue |
| **Slots** | helper, error |
| **HTML** | `<div><label>...</label><select><option>...</select></div>` |

### `c-checkbox`
Checkbox input.

| Aspect | Definition |
|--------|------------|
| **Props** | label, checked, value, name, disabled, required, invalid, id |
| **Specific** | indeterminate (boolean) |
| **Slots** | label, description |
| **HTML** | `<label><input type="checkbox">{label}</label>` |

### `c-checkbox-group`
Group of checkboxes.

| Aspect | Definition |
|--------|------------|
| **Props** | label, options, value (array), name, disabled, required, invalid, direction |
| **Slots** | helper, error |
| **HTML** | `<fieldset><legend>...</legend>{checkboxes}</fieldset>` |

### `c-radio`
Radio button.

| Aspect | Definition |
|--------|------------|
| **Props** | label, checked, value, name, disabled, id |
| **Slots** | label, description |
| **HTML** | `<label><input type="radio">{label}</label>` |

### `c-radio-group`
Group of radio buttons.

| Aspect | Definition |
|--------|------------|
| **Props** | label, options, value, name, disabled, required, invalid, direction |
| **Slots** | helper, error |
| **HTML** | `<fieldset role="radiogroup"><legend>...</legend>{radios}</fieldset>` |

### `c-switch`
Toggle switch.

| Aspect | Definition |
|--------|------------|
| **Props** | label, checked, disabled, id |
| **Specific** | onLabel, offLabel |
| **Slots** | label |
| **HTML** | `<label><input type="checkbox" role="switch">{label}</label>` |

### `c-range`
Range slider.

| Aspect | Definition |
|--------|------------|
| **Props** | label, value, name, disabled, id |
| **Specific** | min, max, step, showValue |
| **Slots** | helper |
| **HTML** | `<div><label>...</label><input type="range"></div>` |

### `c-form-field`
Wrapper for form fields with label, helper, error.

| Aspect | Definition |
|--------|------------|
| **Props** | label, description, required, invalid, id |
| **Specific** | errorMessage, helperText |
| **Slots** | default (input), helper, error |
| **HTML** | `<div class="form-field"><label>...</label>{slot}<span class="helper">...</span></div>` |

### `c-form`
Form container.

| Aspect | Definition |
|--------|------------|
| **Props** | loading, autocomplete |
| **Specific** | action, method, enctype, novalidate |
| **Slots** | default, actions (submit buttons) |
| **HTML** | `<form>{slot}</form>` |

---

## Navigation

### `c-nav`
Navigation container.

| Aspect | Definition |
|--------|------------|
| **Props** | items, direction |
| **Specific** | variant (default/pills/tabs), ariaLabel |
| **Slots** | default (nav-items) |
| **HTML** | `<nav aria-label="...">{slot}</nav>` |

### `c-nav-item`
Navigation item.

| Aspect | Definition |
|--------|------------|
| **Props** | href, icon, active, disabled, target |
| **Slots** | default (label) |
| **HTML** | `<a href="..." aria-current="page?">{slot}</a>` |

### `c-breadcrumb`
Breadcrumb navigation.

| Aspect | Definition |
|--------|------------|
| **Props** | items |
| **Specific** | separator (string/icon) |
| **Slots** | default (breadcrumb-items) |
| **HTML** | `<nav aria-label="Breadcrumb"><ol>...</ol></nav>` |

### `c-breadcrumb-item`
Single breadcrumb.

| Aspect | Definition |
|--------|------------|
| **Props** | href, active |
| **Slots** | default (label) |
| **HTML** | `<li><a href="...">{slot}</a></li>` |

### `c-tabs`
Tabbed interface.

| Aspect | Definition |
|--------|------------|
| **Props** | items |
| **Specific** | activeTab, variant (default/boxed/pills), fitted (boolean) |
| **Slots** | default (tab-panels) |
| **HTML** | `<div role="tablist">...</div><div role="tabpanel">...</div>` |

### `c-tab`
Single tab button.

| Aspect | Definition |
|--------|------------|
| **Props** | icon, active, disabled |
| **Specific** | panelId |
| **Slots** | default (label) |
| **HTML** | `<button role="tab" aria-selected="...">{slot}</button>` |

### `c-tab-panel`
Tab content panel.

| Aspect | Definition |
|--------|------------|
| **Props** | active |
| **Specific** | tabId |
| **Slots** | default |
| **HTML** | `<div role="tabpanel" hidden?>{slot}</div>` |

### `c-menu`
Dropdown menu.

| Aspect | Definition |
|--------|------------|
| **Props** | items, open |
| **Specific** | placement (top/bottom/left/right), trigger (click/hover) |
| **Slots** | trigger, default (menu-items) |
| **HTML** | `<div class="menu"><button>{trigger}</button><ul role="menu">...</ul></div>` |

### `c-menu-item`
Menu item.

| Aspect | Definition |
|--------|------------|
| **Props** | href, icon, disabled, active |
| **Specific** | destructive (boolean) |
| **Slots** | default (label), description |
| **HTML** | `<li role="menuitem"><a>{slot}</a></li>` |

### `c-pagination`
Page navigation.

| Aspect | Definition |
|--------|------------|
| **Props** | size |
| **Specific** | currentPage, totalPages, totalItems, itemsPerPage, showFirstLast, showPrevNext, maxVisiblePages |
| **Slots** | none |
| **HTML** | `<nav aria-label="Pagination"><ul>...</ul></nav>` |

### `c-skip-link`
Skip to content link.

| Aspect | Definition |
|--------|------------|
| **Props** | href |
| **Slots** | default (default: "Skip to main content") |
| **HTML** | `<a href="#main" class="skip-link">{slot}</a>` |

---

## Feedback

### `c-alert`
Alert message.

| Aspect | Definition |
|--------|------------|
| **Props** | variant, title, icon, closable, dismissible |
| **Slots** | default (message), actions |
| **HTML** | `<div role="alert">{icon}<div>{title}{slot}</div>{close}</div>` |

### `c-notification`
Toast notification.

| Aspect | Definition |
|--------|------------|
| **Props** | variant, title, icon, closable |
| **Specific** | duration (ms, 0 = persistent), position (top-right/top-left/bottom-right/bottom-left) |
| **Slots** | default (message), actions |
| **HTML** | `<div role="status" aria-live="polite">...</div>` |

### `c-badge`
Small status indicator.

| Aspect | Definition |
|--------|------------|
| **Props** | variant, size |
| **Specific** | dot (boolean - just a dot, no text), max (number - shows "99+" if exceeded) |
| **Slots** | default (text/number) |
| **HTML** | `<span class="badge">{slot}</span>` |

### `c-tag`
Label/chip for categorization.

| Aspect | Definition |
|--------|------------|
| **Props** | variant, size, closable, icon |
| **Specific** | clickable (boolean) |
| **Slots** | default (text) |
| **HTML** | `<span class="tag">{slot}{close?}</span>` |

### `c-progress`
Progress bar.

| Aspect | Definition |
|--------|------------|
| **Props** | variant, size, ariaLabel |
| **Specific** | value (0-100), max, indeterminate (boolean), showValue (boolean) |
| **Slots** | none |
| **HTML** | `<div role="progressbar" aria-valuenow="...">...</div>` |

### `c-progress-tracker`
Multi-step progress.

| Aspect | Definition |
|--------|------------|
| **Props** | steps, direction |
| **Specific** | variant (default/compact), clickable (boolean) |
| **Slots** | none |
| **HTML** | `<ol class="progress-tracker">{steps}</ol>` |

### `c-spinner`
Loading spinner.

| Aspect | Definition |
|--------|------------|
| **Props** | size, ariaLabel |
| **Slots** | none |
| **HTML** | `<div role="status" aria-label="Loading"><svg>...</svg></div>` |

### `c-skeleton`
Loading placeholder.

| Aspect | Definition |
|--------|------------|
| **Props** | - |
| **Specific** | variant (text/circle/rect), width, height, lines (number) |
| **Slots** | none |
| **HTML** | `<div class="skeleton" aria-hidden="true"></div>` |

### `c-empty`
Empty state placeholder.

| Aspect | Definition |
|--------|------------|
| **Props** | title, description, icon |
| **Slots** | default (custom content), actions |
| **HTML** | `<div class="empty-state">{icon}<h3>{title}</h3><p>{description}</p>{actions}</div>` |

---

## Data Display

### `c-table`
Data table.

| Aspect | Definition |
|--------|------------|
| **Props** | items, columns, loading |
| **Specific** | striped (boolean), hoverable (boolean), bordered (boolean), compact (boolean), sortable (boolean), selectable (boolean), caption |
| **Slots** | header, footer, empty |
| **HTML** | `<table><caption>...</caption><thead>...</thead><tbody>...</tbody></table>` |

### `c-list`
List container.

| Aspect | Definition |
|--------|------------|
| **Props** | items |
| **Specific** | variant (default/bordered/divided), interactive (boolean) |
| **Slots** | default (list-items) |
| **HTML** | `<ul class="list">{slot}</ul>` |

### `c-list-item`
List item.

| Aspect | Definition |
|--------|------------|
| **Props** | href, icon, active, selected, disabled |
| **Slots** | default, prefix, suffix, description |
| **HTML** | `<li><a?>{slot}</a?></li>` |

### `c-card`
Content card.

| Aspect | Definition |
|--------|------------|
| **Props** | title, padding, href |
| **Specific** | variant (default/outlined/elevated), interactive (boolean), image, imagePosition (top/left/right) |
| **Slots** | default, header, footer, media |
| **HTML** | `<article class="card"><header>...</header><div>{slot}</div><footer>...</footer></article>` |

### `c-description-list`
Key-value pairs.

| Aspect | Definition |
|--------|------------|
| **Props** | items |
| **Specific** | layout (stacked/horizontal/grid) |
| **Slots** | default (dt/dd pairs) |
| **HTML** | `<dl>{items}</dl>` |

### `c-avatar`
User avatar.

| Aspect | Definition |
|--------|------------|
| **Props** | src, alt, size |
| **Specific** | initials (fallback text), shape (circle/square) |
| **Slots** | none |
| **HTML** | `<span class="avatar"><img> or <span>{initials}</span></span>` |

### `c-avatar-group`
Stacked avatars.

| Aspect | Definition |
|--------|------------|
| **Props** | size |
| **Specific** | max (number - shows "+N" overflow) |
| **Slots** | default (avatars) |
| **HTML** | `<div class="avatar-group">{slot}</div>` |

### `c-icon`
Icon display.

| Aspect | Definition |
|--------|------------|
| **Props** | size, color, ariaLabel |
| **Specific** | name (icon name) |
| **Slots** | none |
| **HTML** | `<svg aria-hidden="true">...</svg>` or `<span aria-label="...">{icon}</span>` |

### `c-image`
Responsive image.

| Aspect | Definition |
|--------|------------|
| **Props** | src, alt |
| **Specific** | width, height, loading (eager/lazy), objectFit (cover/contain/fill), fallback |
| **Slots** | none |
| **HTML** | `<img src="..." alt="..." loading="...">` |

### `c-figure`
Image with caption.

| Aspect | Definition |
|--------|------------|
| **Props** | src, alt |
| **Specific** | caption, captionPosition (below/above/overlay) |
| **Slots** | default (image), caption |
| **HTML** | `<figure><img><figcaption>{caption}</figcaption></figure>` |

### `c-code`
Inline code.

| Aspect | Definition |
|--------|------------|
| **Props** | - |
| **Slots** | default |
| **HTML** | `<code>{slot}</code>` |

### `c-codeblock`
Code block with highlighting.

| Aspect | Definition |
|--------|------------|
| **Props** | - |
| **Specific** | language, showLineNumbers (boolean), highlightLines (array), copyable (boolean) |
| **Slots** | default (code) |
| **HTML** | `<pre><code class="language-...">{slot}</code></pre>` |

### `c-time`
Formatted time/date.

| Aspect | Definition |
|--------|------------|
| **Props** | - |
| **Specific** | datetime (ISO string), format (relative/date/time/datetime), locale |
| **Slots** | none |
| **HTML** | `<time datetime="...">{formatted}</time>` |

---

## Overlay

### `c-modal`
Modal dialog.

| Aspect | Definition |
|--------|------------|
| **Props** | title, open, closable |
| **Specific** | size (sm/md/lg/xl/full), closeOnBackdrop (boolean), closeOnEscape (boolean) |
| **Slots** | default, header, footer |
| **HTML** | `<dialog><header>...</header><div>{slot}</div><footer>...</footer></dialog>` |

### `c-drawer`
Slide-out panel.

| Aspect | Definition |
|--------|------------|
| **Props** | title, open, closable |
| **Specific** | position (left/right/top/bottom), size (sm/md/lg) |
| **Slots** | default, header, footer |
| **HTML** | `<aside class="drawer">...</aside>` |

### `c-popover`
Contextual popup.

| Aspect | Definition |
|--------|------------|
| **Props** | open |
| **Specific** | placement (top/bottom/left/right + start/end), trigger (click/hover/focus), arrow (boolean) |
| **Slots** | trigger, default (content) |
| **HTML** | `<div class="popover-wrapper">{trigger}<div class="popover">{slot}</div></div>` |

### `c-tooltip`
Simple tooltip.

| Aspect | Definition |
|--------|------------|
| **Props** | - |
| **Specific** | content (text), placement, delay (ms) |
| **Slots** | default (trigger element) |
| **HTML** | `<span data-tooltip="...">{slot}</span>` or via JS |

### `c-dropdown`
Dropdown container (generic).

| Aspect | Definition |
|--------|------------|
| **Props** | open |
| **Specific** | placement, trigger (click/hover) |
| **Slots** | trigger, default |
| **HTML** | `<div class="dropdown">{trigger}<div class="dropdown-content">{slot}</div></div>` |

---

## Typography

### `c-heading`
Semantic heading.

| Aspect | Definition |
|--------|------------|
| **Props** | - |
| **Specific** | level (1-6), size (override visual size), truncate (boolean) |
| **Slots** | default |
| **HTML** | `<h1-6>{slot}</h1-6>` |

### `c-text`
Text with styling.

| Aspect | Definition |
|--------|------------|
| **Props** | size, color |
| **Specific** | variant (body/caption/overline/lead), weight (normal/medium/bold), align (left/center/right), truncate (boolean/lines) |
| **Slots** | default |
| **HTML** | `<p class="text-...">{slot}</p>` |

### `c-prose`
Rich text content wrapper.

| Aspect | Definition |
|--------|------------|
| **Props** | size |
| **Slots** | default (HTML content) |
| **HTML** | `<div class="prose">{slot}</div>` |

---

## Utility

### `c-visually-hidden`
Accessible hidden text.

| Aspect | Definition |
|--------|------------|
| **Props** | - |
| **Slots** | default |
| **HTML** | `<span class="sr-only">{slot}</span>` |

### `c-portal`
Render children elsewhere in DOM.

| Aspect | Definition |
|--------|------------|
| **Props** | - |
| **Specific** | target (selector or "body") |
| **Slots** | default |
| **HTML** | Children rendered at target |

### `c-focus-trap`
Trap focus within children.

| Aspect | Definition |
|--------|------------|
| **Props** | active |
| **Slots** | default |
| **HTML** | `<div>{slot}</div>` with focus management |

---

## Summary

| Category | Count | Components |
|----------|-------|------------|
| Layout | 9 | page, layout, container, stack, grid, grid-item, section, divider, spacer |
| Actions | 4 | button, button-group, icon-button, link |
| Form Inputs | 12 | input, textarea, select, checkbox, checkbox-group, radio, radio-group, switch, range, form-field, form |
| Navigation | 10 | nav, nav-item, breadcrumb, breadcrumb-item, tabs, tab, tab-panel, menu, menu-item, pagination, skip-link |
| Feedback | 8 | alert, notification, badge, tag, progress, progress-tracker, spinner, skeleton, empty |
| Data Display | 13 | table, list, list-item, card, description-list, avatar, avatar-group, icon, image, figure, code, codeblock, time |
| Overlay | 5 | modal, drawer, popover, tooltip, dropdown |
| Typography | 3 | heading, text, prose |
| Utility | 3 | visually-hidden, portal, focus-trap |

**Total: ~67 components**

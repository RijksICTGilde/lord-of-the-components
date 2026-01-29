# HTML Output Strategy

> How components render to semantic, accessible HTML. This defines the **structure** - themes provide the **styling**.

## Principles

1. **Semantic HTML first** - Use proper HTML elements (`<button>`, `<nav>`, `<dialog>`)
2. **Accessibility built-in** - ARIA roles, labels, keyboard support
3. **Progressive enhancement** - Works without JS, enhanced with JS
4. **CSS-agnostic** - Output has logical class names, themes map to their CSS
5. **Data attributes** - State communicated via `data-*` attributes

## Class Naming Convention

Classes follow a predictable pattern that themes can target:

```
c-{component}                    /* Base: c-button */
c-{component}--{variant}         /* Variant: c-button--primary */
c-{component}--{size}            /* Size: c-button--lg */
c-{component}--{state}           /* State: c-button--loading */
c-{component}__{element}         /* Child: c-button__icon */
```

## Data Attributes for State

```html
<!-- States via data attributes (CSS can target these) -->
<button
  data-variant="primary"
  data-size="lg"
  data-loading="true"
  data-disabled="false">
```

## Component Output Examples

### Button

```html
<!-- Basic -->
<button type="button" class="c-button" data-variant="primary" data-size="md">
  Click me
</button>

<!-- With icon -->
<button type="button" class="c-button" data-variant="primary" data-size="md">
  <span class="c-button__icon c-button__icon--before" aria-hidden="true">
    <svg>...</svg>
  </span>
  <span class="c-button__label">Download</span>
</button>

<!-- Loading -->
<button type="button" class="c-button" data-variant="primary" data-loading="true" disabled>
  <span class="c-button__spinner" aria-hidden="true">
    <svg>...</svg>
  </span>
  <span class="c-button__label">Loading...</span>
</button>

<!-- As link -->
<a href="/page" class="c-button" data-variant="secondary">
  Go to page
</a>
```

### Input

```html
<div class="c-form-field" data-invalid="false" data-required="true">
  <label class="c-form-field__label" for="email-123">
    Email
    <span class="c-form-field__required" aria-hidden="true">*</span>
  </label>

  <div class="c-input" data-size="md">
    <span class="c-input__prefix" aria-hidden="true">
      <svg><!-- mail icon --></svg>
    </span>
    <input
      type="email"
      id="email-123"
      name="email"
      class="c-input__field"
      placeholder="you@example.com"
      required
      aria-describedby="email-123-helper"
    >
  </div>

  <span class="c-form-field__helper" id="email-123-helper">
    We'll never share your email.
  </span>
</div>

<!-- Invalid state -->
<div class="c-form-field" data-invalid="true" data-required="true">
  <label class="c-form-field__label" for="email-456">Email</label>

  <div class="c-input" data-size="md" data-invalid="true">
    <input
      type="email"
      id="email-456"
      class="c-input__field"
      aria-invalid="true"
      aria-describedby="email-456-error"
    >
  </div>

  <span class="c-form-field__error" id="email-456-error" role="alert">
    Please enter a valid email address.
  </span>
</div>
```

### Select

```html
<div class="c-form-field">
  <label class="c-form-field__label" for="country-123">Country</label>

  <div class="c-select" data-size="md">
    <select id="country-123" name="country" class="c-select__field">
      <option value="">Select a country...</option>
      <option value="nl">Netherlands</option>
      <option value="be">Belgium</option>
      <option value="de">Germany</option>
    </select>
    <span class="c-select__indicator" aria-hidden="true">
      <svg><!-- chevron --></svg>
    </span>
  </div>
</div>
```

### Checkbox / Radio

```html
<!-- Single checkbox -->
<label class="c-checkbox" data-checked="false">
  <input type="checkbox" class="c-checkbox__input" name="terms" value="accepted">
  <span class="c-checkbox__control" aria-hidden="true">
    <svg class="c-checkbox__check"><!-- checkmark --></svg>
  </span>
  <span class="c-checkbox__label">I accept the terms</span>
</label>

<!-- Checkbox group -->
<fieldset class="c-checkbox-group">
  <legend class="c-checkbox-group__legend">Preferences</legend>

  <label class="c-checkbox">
    <input type="checkbox" name="prefs" value="email">
    <span class="c-checkbox__control" aria-hidden="true"></span>
    <span class="c-checkbox__label">Email notifications</span>
  </label>

  <label class="c-checkbox">
    <input type="checkbox" name="prefs" value="sms">
    <span class="c-checkbox__control" aria-hidden="true"></span>
    <span class="c-checkbox__label">SMS notifications</span>
  </label>
</fieldset>

<!-- Radio group -->
<fieldset class="c-radio-group" role="radiogroup">
  <legend class="c-radio-group__legend">Payment method</legend>

  <label class="c-radio">
    <input type="radio" name="payment" value="card" checked>
    <span class="c-radio__control" aria-hidden="true"></span>
    <span class="c-radio__label">Credit card</span>
  </label>

  <label class="c-radio">
    <input type="radio" name="payment" value="ideal">
    <span class="c-radio__control" aria-hidden="true"></span>
    <span class="c-radio__label">iDEAL</span>
  </label>
</fieldset>
```

### Alert

```html
<div class="c-alert" data-variant="warning" role="alert">
  <span class="c-alert__icon" aria-hidden="true">
    <svg><!-- warning icon --></svg>
  </span>

  <div class="c-alert__content">
    <strong class="c-alert__title">Warning</strong>
    <p class="c-alert__message">Your session will expire in 5 minutes.</p>
  </div>

  <button class="c-alert__close" type="button" aria-label="Dismiss">
    <svg aria-hidden="true"><!-- x icon --></svg>
  </button>
</div>
```

### Card

```html
<article class="c-card" data-variant="default">
  <header class="c-card__header">
    <h3 class="c-card__title">Card Title</h3>
  </header>

  <div class="c-card__body">
    <p>Card content goes here.</p>
  </div>

  <footer class="c-card__footer">
    <button class="c-button" data-variant="primary">Action</button>
  </footer>
</article>

<!-- Clickable card -->
<article class="c-card" data-variant="default" data-interactive="true">
  <a href="/article/123" class="c-card__link">
    <header class="c-card__header">
      <h3 class="c-card__title">Clickable Card</h3>
    </header>
    <div class="c-card__body">
      <p>Click anywhere to navigate.</p>
    </div>
  </a>
</article>
```

### Modal

```html
<dialog class="c-modal" data-size="md" open>
  <div class="c-modal__backdrop" data-close-on-click="true"></div>

  <div class="c-modal__container" role="document">
    <header class="c-modal__header">
      <h2 class="c-modal__title" id="modal-title-123">Confirm Action</h2>
      <button class="c-modal__close" type="button" aria-label="Close">
        <svg aria-hidden="true"><!-- x icon --></svg>
      </button>
    </header>

    <div class="c-modal__body">
      <p>Are you sure you want to proceed?</p>
    </div>

    <footer class="c-modal__footer">
      <button class="c-button" data-variant="secondary">Cancel</button>
      <button class="c-button" data-variant="primary">Confirm</button>
    </footer>
  </div>
</dialog>
```

### Navigation

```html
<nav class="c-nav" aria-label="Main navigation">
  <ul class="c-nav__list">
    <li class="c-nav__item">
      <a href="/" class="c-nav__link" aria-current="page" data-active="true">
        <span class="c-nav__icon" aria-hidden="true"><svg>...</svg></span>
        <span class="c-nav__label">Home</span>
      </a>
    </li>
    <li class="c-nav__item">
      <a href="/products" class="c-nav__link">
        <span class="c-nav__label">Products</span>
      </a>
    </li>
    <li class="c-nav__item">
      <a href="/about" class="c-nav__link" data-disabled="true" aria-disabled="true">
        <span class="c-nav__label">About (Coming soon)</span>
      </a>
    </li>
  </ul>
</nav>
```

### Breadcrumb

```html
<nav class="c-breadcrumb" aria-label="Breadcrumb">
  <ol class="c-breadcrumb__list">
    <li class="c-breadcrumb__item">
      <a href="/" class="c-breadcrumb__link">Home</a>
      <span class="c-breadcrumb__separator" aria-hidden="true">/</span>
    </li>
    <li class="c-breadcrumb__item">
      <a href="/products" class="c-breadcrumb__link">Products</a>
      <span class="c-breadcrumb__separator" aria-hidden="true">/</span>
    </li>
    <li class="c-breadcrumb__item" aria-current="page">
      <span class="c-breadcrumb__current">Widget Pro</span>
    </li>
  </ol>
</nav>
```

### Tabs

```html
<div class="c-tabs">
  <div class="c-tabs__list" role="tablist" aria-label="Account settings">
    <button
      class="c-tabs__tab"
      role="tab"
      id="tab-profile"
      aria-selected="true"
      aria-controls="panel-profile"
      data-active="true">
      Profile
    </button>
    <button
      class="c-tabs__tab"
      role="tab"
      id="tab-security"
      aria-selected="false"
      aria-controls="panel-security"
      tabindex="-1">
      Security
    </button>
  </div>

  <div
    class="c-tabs__panel"
    role="tabpanel"
    id="panel-profile"
    aria-labelledby="tab-profile">
    <p>Profile settings...</p>
  </div>

  <div
    class="c-tabs__panel"
    role="tabpanel"
    id="panel-security"
    aria-labelledby="tab-security"
    hidden>
    <p>Security settings...</p>
  </div>
</div>
```

### Table

```html
<div class="c-table-wrapper">
  <table class="c-table" data-striped="true" data-hoverable="true">
    <caption class="c-table__caption">User list</caption>

    <thead class="c-table__head">
      <tr class="c-table__row">
        <th class="c-table__header" scope="col">Name</th>
        <th class="c-table__header" scope="col">Email</th>
        <th class="c-table__header" scope="col">Role</th>
      </tr>
    </thead>

    <tbody class="c-table__body">
      <tr class="c-table__row">
        <td class="c-table__cell">John Doe</td>
        <td class="c-table__cell">john@example.com</td>
        <td class="c-table__cell">Admin</td>
      </tr>
      <tr class="c-table__row">
        <td class="c-table__cell">Jane Smith</td>
        <td class="c-table__cell">jane@example.com</td>
        <td class="c-table__cell">User</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Progress

```html
<!-- Determinate -->
<div class="c-progress" data-variant="primary" data-size="md">
  <div
    class="c-progress__bar"
    role="progressbar"
    aria-valuenow="65"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-label="Upload progress"
    style="width: 65%">
  </div>
  <span class="c-progress__value">65%</span>
</div>

<!-- Indeterminate -->
<div class="c-progress" data-variant="primary" data-indeterminate="true">
  <div
    class="c-progress__bar"
    role="progressbar"
    aria-label="Loading">
  </div>
</div>
```

### Stack & Grid

```html
<!-- Stack -->
<div class="c-stack" data-direction="vertical" data-gap="md" data-align="stretch">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

<!-- Grid -->
<div class="c-grid" data-cols="3" data-gap="lg">
  <div class="c-grid__item">1</div>
  <div class="c-grid__item" data-col-span="2">2 (spans 2)</div>
  <div class="c-grid__item">3</div>
</div>
```

## Theme Mapping

Themes take these semantic classes and map to their CSS framework:

### RVO Theme Example

```css
/* Theme: RVO (Rijkshuisstijl) */
.c-button { /* base button styles from RVO */ }
.c-button[data-variant="primary"] {
  @apply rvo-button rvo-button--primary;
}
.c-button[data-variant="secondary"] {
  @apply rvo-button rvo-button--secondary;
}
.c-button[data-size="sm"] {
  @apply rvo-button--small;
}
```

### Bootstrap Theme Example

```css
/* Theme: Bootstrap */
.c-button { /* maps to Bootstrap */ }
.c-button[data-variant="primary"] {
  @apply btn btn-primary;
}
.c-button[data-size="lg"] {
  @apply btn-lg;
}
```

### Tailwind Theme Example

```css
/* Theme: Tailwind */
.c-button {
  @apply inline-flex items-center justify-center font-medium rounded-md;
}
.c-button[data-variant="primary"] {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}
.c-button[data-size="sm"] {
  @apply px-3 py-1.5 text-sm;
}
```

## JavaScript Enhancement

Components work without JavaScript, but can be enhanced:

```html
<!-- Dropdown: works with CSS :focus-within, enhanced with JS -->
<div class="c-dropdown" data-enhanced="false">
  <button class="c-dropdown__trigger" aria-expanded="false" aria-haspopup="true">
    Options
  </button>
  <div class="c-dropdown__content">
    <!-- items -->
  </div>
</div>

<!-- After JS enhancement -->
<div class="c-dropdown" data-enhanced="true">
  <button class="c-dropdown__trigger" aria-expanded="true" aria-haspopup="true">
    Options
  </button>
  <div class="c-dropdown__content" role="menu">
    <!-- items with proper keyboard navigation -->
  </div>
</div>
```

## ID Generation

Auto-generate IDs for accessibility associations:

```html
<!-- Input: lotc-input-a1b2c3 -->
<label for="lotc-input-a1b2c3">Email</label>
<input id="lotc-input-a1b2c3" aria-describedby="lotc-input-a1b2c3-helper">
<span id="lotc-input-a1b2c3-helper">Helper text</span>
```

Pattern: `lotc-{component}-{random}`

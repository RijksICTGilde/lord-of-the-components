/**
 * Lord of the Components — behaviour for the components NLDD does not ship.
 *
 * Loaded once per page via lotc_nldd's js_urls (a module, so it runs after the
 * document is parsed). This used to be an inline <script> inside the component
 * template, repeated for every instance on the page and impossible under a CSP
 * without 'unsafe-inline'.
 *
 * Style note, so this can go upstream unchanged: NLDD's own components are
 * light-DOM custom elements (its CSS reaches them as `nldd-form > form`), and
 * state lives on attributes. Same here, minus Lit — we do not depend on it, so
 * these are plain HTMLElement subclasses. The server renders the full markup;
 * the element only takes over behaviour, so the field still shows its masked
 * value with JavaScript off.
 */

/** The dots a masked value is shown as. */
const MASK_CHARACTER = '•';

class LotcSecretField extends HTMLElement {
	static observedAttributes = ['revealed'];

	connectedCallback() {
		this.addEventListener('click', this);
	}

	disconnectedCallback() {
		this.removeEventListener('click', this);
	}

	/** `revealed` is the single source of truth: the CSS reads the attribute,
	 *  and so does the rendering below. An app can flip it either way round. */
	get revealed() {
		return this.hasAttribute('revealed');
	}

	set revealed(value) {
		this.toggleAttribute('revealed', Boolean(value));
	}

	get value() {
		return this.getAttribute('value') || '';
	}

	get maskLength() {
		return parseInt(this.getAttribute('mask-length') || '12', 10) || 12;
	}

	attributeChangedCallback() {
		this.#render();
	}

	handleEvent(event) {
		const button = event.target.closest('button[data-action]');
		if (!button || !this.contains(button)) return;
		if (button.dataset.action === 'reveal') {
			this.revealed = !this.revealed;
		} else if (button.dataset.action === 'copy') {
			copyToClipboard(this.value, button);
		}
	}

	#render() {
		const code = this.querySelector('code');
		if (code) {
			code.textContent = this.revealed ? this.value : MASK_CHARACTER.repeat(this.maskLength);
			code.setAttribute('aria-label', this.revealed ? 'Waarde' : 'Afgeschermde waarde');
		}
		const toggle = this.querySelector('button[data-action="reveal"]');
		if (!toggle) return;
		toggle.setAttribute('aria-pressed', this.revealed ? 'true' : 'false');
		toggle.setAttribute('title', this.revealed ? 'Verbergen' : 'Tonen');
		const icon = toggle.querySelector('nldd-icon');
		if (icon) icon.setAttribute('name', this.revealed ? 'eye-slash' : 'eye');
	}
}

/**
 * Copy `value`, and say so in the button's tooltip for a moment.
 * Shared with the copyfield in lotc-forms, which is the same chrome without
 * the masking.
 */
export function copyToClipboard(value, button) {
	if (navigator.clipboard) navigator.clipboard.writeText(value);
	const original = button.getAttribute('title');
	button.setAttribute('title', 'Gekopieerd');
	setTimeout(() => button.setAttribute('title', original), 1200);
}

if (!customElements.get('lotc-secret-field')) {
	customElements.define('lotc-secret-field', LotcSecretField);
}

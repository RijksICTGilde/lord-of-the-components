/**
 * Lord of the Components — behaviour for the form fields.
 *
 * Loaded once per page via lotc_forms' js_urls. These handlers used to be
 * inline <script> blocks in the field templates: one copy per field on the
 * page, and no CSP without 'unsafe-inline'.
 *
 * Both work by delegation from the document, so fields that arrive later —
 * an htmx swap, a formset row — need no re-initialisation.
 */

/** Copy button on the copyfield (text-input-field with show-copy). */
document.addEventListener('click', (event) => {
	const button = event.target.closest('[data-lotc-copy]');
	if (!button) return;
	const value = button.closest('.lotc-copyfield')?.querySelector('.lotc-copyfield__value');
	if (!value) return;
	if (navigator.clipboard) navigator.clipboard.writeText(value.dataset.value);
	const original = button.getAttribute('title');
	button.setAttribute('title', 'Gekopieerd');
	setTimeout(() => button.setAttribute('title', original), 1200);
});

/**
 * Select the option a server-rendered <select> was given.
 *
 * `<select value="…">` is not a thing in HTML — the selected option is. The
 * templates used to emit a one-line <script> per select to assign it; the value
 * now travels as a data attribute and this applies it.
 */
function applySelectValues(root = document) {
	for (const select of root.querySelectorAll('select[data-lotc-value]')) {
		select.value = select.dataset.lotcValue;
	}
}

applySelectValues();
// A select can also arrive after load (htmx swap, a dialog): re-apply for any
// subtree that appears. Cheap — the query only runs on added element nodes.
new MutationObserver((records) => {
	for (const record of records) {
		for (const node of record.addedNodes) {
			if (node.nodeType === Node.ELEMENT_NODE) applySelectValues(node);
		}
	}
}).observe(document.documentElement, { childList: true, subtree: true });

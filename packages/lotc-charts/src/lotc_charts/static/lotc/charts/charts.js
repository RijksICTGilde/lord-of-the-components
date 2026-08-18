/**
 * Lord of the Components — chart behaviour (Chart.js).
 *
 * Loaded once per page via lotc_charts' js_urls. Each chart used to carry its
 * own inline <script> with its configuration baked in: one per chart, and no
 * CSP without 'unsafe-inline'. Now the configuration travels as JSON on the
 * canvas (`data-lotc-gauge` / `data-lotc-line-chart`) and this builds it.
 *
 * Colours are NOT in that JSON: they come from the theme, resolved here. Two
 * things make reading a token non-obvious.
 *
 *   1. `getComputedStyle(root).getPropertyValue('--x')` hands back the custom
 *      property's own token sequence, and `light-dark()` is not resolved there
 *      — you get the literal string `light-dark(…, …)`, which Chart.js cannot
 *      parse. So let the browser USE the token on a probe element and read the
 *      used value.
 *   2. That value comes back in the token's colour space (the NLDD primitives
 *      are oklch) and Chart.js' colour parser does not speak oklch. So push it
 *      through a 1×1 canvas and hand over the sRGB it painted.
 */

const scratch = document.createElement('canvas');
scratch.width = scratch.height = 1;
const scratchContext = scratch.getContext('2d', { willReadFrequently: true });

/** The colour the theme actually paints for `token`, as plain sRGB. */
export function themeColour(token, fallback) {
	const probe = document.createElement('span');
	probe.style.cssText = `position:absolute;left:-9999px;top:-9999px;color:var(${token},${fallback})`;
	document.body.appendChild(probe);
	const used = getComputedStyle(probe).color;
	probe.remove();
	scratchContext.clearRect(0, 0, 1, 1);
	scratchContext.fillStyle = fallback;
	scratchContext.fillStyle = used;
	scratchContext.fillRect(0, 0, 1, 1);
	const [r, g, b, a] = scratchContext.getImageData(0, 0, 1, 1).data;
	return `rgba(${r},${g},${b},${a / 255})`;
}

function buildGauge(canvas, config) {
	const value = parseFloat(config.value) || 0;
	return {
		type: 'doughnut',
		data: {
			labels: [],
			datasets: [
				{
					data: [value, 100 - value],
					backgroundColor: [
						config.color || themeColour('--semantics-content-accent-color', '#154273'),
						// The track is the empty part of the ring: it carries the scale, so
						// it has to stay distinguishable from the page. A surface tint does
						// not (1.2:1 on a dark page) — a divider is a line colour.
						themeColour('--semantics-dividers-color', '#eef0f4'),
					],
					borderWidth: 0,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			cutout: '72%',
			circumference: 270,
			rotation: 225,
			plugins: { legend: { display: false }, tooltip: { enabled: false } },
		},
	};
}

function buildLineChart(canvas, config) {
	// Chart.js paints its ticks and legend in its own default grey (#666),
	// unreadable on a dark page, and its grid defaults to a fixed black tint.
	const inkMuted = themeColour('--semantics-content-secondary-color', '#5a5a5a');
	const gridLine = themeColour('--semantics-dividers-color', 'rgba(0,0,0,.06)');
	const critical = themeColour('--semantics-categories-critical-filled-background-color', '#d52b1e');
	const onCritical = themeColour('--semantics-categories-critical-filled-content-color', '#fff');
	const accent = themeColour('--semantics-categories-accent-filled-background-color', '#007bc7');
	const onAccent = themeColour('--semantics-categories-accent-filled-content-color', '#fff');

	const annotations = {};
	const threshold = (at, colour, contentColour, content, position, dash) => ({
		type: 'line',
		yMin: at,
		yMax: at,
		borderColor: colour,
		borderWidth: 2,
		borderDash: dash,
		label: { display: true, content, position, backgroundColor: colour, color: contentColour, font: { size: 10 } },
	});
	if (config.limit !== undefined && config.limit !== '') {
		annotations.limit = threshold(config.limit, critical, onCritical, 'Limit', 'end', [6, 4]);
	}
	if (config.request !== undefined && config.request !== '') {
		annotations.request = threshold(config.request, accent, onAccent, 'Request', 'start', [3, 3]);
	}

	return {
		type: 'line',
		data: config.data || {},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: Boolean(config.legend),
					labels: { color: inkMuted, font: { family: 'RijksSans, system-ui, sans-serif' } },
				},
				annotation: { annotations },
			},
			scales: {
				x: { grid: { display: false }, ticks: { color: inkMuted }, border: { color: gridLine } },
				y: { grid: { color: gridLine }, ticks: { color: inkMuted }, border: { color: gridLine } },
			},
			elements: { line: { tension: 0.4, borderWidth: 2 }, point: { radius: 0, hoverRadius: 4 } },
			interaction: { intersect: false, mode: 'index' },
		},
	};
}

const BUILDERS = { lotcGauge: buildGauge, lotcLineChart: buildLineChart };

function drawCharts(root = document) {
	if (!window.Chart) return;
	for (const [dataKey, build] of Object.entries(BUILDERS)) {
		const attribute = `data-${dataKey.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}`;
		for (const canvas of root.querySelectorAll(`canvas[${attribute}]`)) {
			if (canvas.dataset.lotcChartDrawn) continue;
			canvas.dataset.lotcChartDrawn = '1';
			new window.Chart(canvas, build(canvas, JSON.parse(canvas.dataset[dataKey])));
		}
	}
}

drawCharts();
// Chart.js is a UMD <script> in <head> and this module is deferred, so it is
// normally there already. If it is not, or a chart arrives later (an htmx
// swap), pick it up when the DOM changes.
new MutationObserver((records) => {
	for (const record of records) {
		for (const node of record.addedNodes) {
			if (node.nodeType === Node.ELEMENT_NODE) drawCharts(node);
		}
	}
}).observe(document.documentElement, { childList: true, subtree: true });

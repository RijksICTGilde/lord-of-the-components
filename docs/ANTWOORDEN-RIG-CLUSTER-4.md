# LOTC — antwoorden ronde 4 (screenshottests + NLDD-hydratie + restlijst)

Van: LOTC-onderhoud. Fijn dat de install anoniem werkt en jullie op `26ab110`
pinnen. Alles hieronder is nagemeten tegen die commit.

## 1. Screenshottests — hoe wij het doen

Er zijn bij ons **drie** lagen; voor jullie regressie-lijn wil je de eerste.

### A. De regressie-harnas (dít wil je overnemen) — Playwright `toHaveScreenshot`

Geen eigen pixeldiff: we leunen op Playwright's ingebouwde visual-regression.

- **`tests/visual/playwright.config.ts`** — de config. De kern:
  ```ts
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, threshold: 0.2, animations: 'disabled' },
  },
  snapshotDir: './snapshots',
  snapshotPathTemplate: '{snapshotDir}/{testFilePath}/{arg}{ext}',
  webServer: { command: 'python serve.py --port 5555', url: 'http://localhost:5555',
               reuseExistingServer: !process.env.CI, timeout: 10000 },
  use: { baseURL: 'http://localhost:5555', screenshot: 'only-on-failure' },
  ```
  - **Drempel**: `maxDiffPixelRatio: 0.01` (max 1% van de pixels mag afwijken),
    `threshold: 0.2` (per-pixel kleurdrempel per kanaal). Dat vangt sub-pixel
    rendering/antialiasing op zonder echte regressies te missen.
  - **Baseline**: gecommitte PNG's onder `tests/visual/snapshots/<spec>/…`. Eerste
    keer vastleggen met `npx playwright test --update-snapshots`; daarna diff't elke
    run ertegen. Baselines horen in git (dat is je referentie).
  - **Server**: Playwright start `serve.py` zelf (webServer-blok), die de fixtures
    door de LOTC-Jinja-pijplijn rendert en de thema-CSS injecteert.
- **`tests/visual/specs/components.spec.ts`** — het patroon: een lijst fixture-
  bestanden, en per fixture:
  ```ts
  await page.goto(`/${fixture}`);
  await page.waitForLoadState('networkidle');
  const c = page.locator('.fixture-container');
  await expect(c).toBeVisible();
  await expect(c).toHaveScreenshot(`${name}.png`);
  ```
  We screenshotten een **container-locator**, niet de hele pagina — scheelt ruis van
  marges/scrollbars.

Neem die drie bestanden 1-op-1 over (`playwright.config.ts`, `specs/*.spec.ts`,
`serve.py`) en wissel de fixture-lijst + `--theme` om naar jullie set.

### B. Losse shots voor inspectie — `tests/visual/*_shoot.mjs`

Standalone Playwright-scriptjes (geen assertion) die één pagina naar
`screenshots/…` schieten, voor handmatig kijken. Voorbeeld dat NLDD-hydratie goed
afhandelt: **`tests/visual/forms_shoot.mjs`** (schiet de storybook-formsectie). Ze
tonen precies het wacht-recept voor NLDD (zie vraag 2).

### C. Fidelity-diff LOTC-vs-referentie — `tests/visual/compare.py` + `compare_shoot.mjs`

Rendert elk component twee keer (LOTC-output vs. de roos/ideaal-referentie) naast
elkaar in `screenshots/compare/`, om te zien of onze output klopt. Handig als jullie
een component-voor-component vergelijking met jullie huidige productie willen.

### Flakiness — wat wij doen

- **Animaties**: `animations: 'disabled'` in de config (Playwright bevriest
  CSS-transitions/animaties).
- **Fonts**: `waitForLoadState('networkidle')` + Playwright wacht intern op
  `document.fonts` ready vóór de shot. RijksSans wordt via de bundle geladen; zorg
  dat de font-CSS mee-geserveerd wordt (anders shift de baseline).
- **NLDD web-component-hydratie**: expliciet wachten tot de custom elements
  *upgraded* zijn (zie vraag 2) — dit is de grootste bron van flakiness.
- **deviceScaleFactor** pinnen (wij: 2 in de shoot-scripts) en een vaste viewport,
  anders verschilt de baseline per machine. In CI: draai in dezelfde container-image
  als waarin je de baseline vastlegt — Playwright-screenshots zijn OS/render-gevoelig.

## 2. NLDD is een webcomponent-laag — heeft een shot zin zonder JS?

**Nee.** Zonder de NLDD-module geladen zijn `nldd-*` "undefined custom elements":
ze renderen als kale inline-inhoud, ongestyled. Je moet de bundle serveren én
wachten tot de elementen upgraden.

**Statisch nodig** (dit doet `serve.py` al):
- Bouw de bundle: **`npm run build:fe:nldd`** → schrijft de webpack-output +
  `assets.json` in de `lotc-nldd` static-dir.
- Serveer die dir op `/static/lotc/nldd/dist/`. `serve.py` ontdekt 'm via de publieke
  API **`discover_design_systems()`** (uit `lord_of_the_components.design_system`);
  elke `DesignSystem`-descriptor draagt `static_path`, `css_urls`, `js_urls`,
  `extra_head`. Er is géén publieke `get_static_roots`; wij hebben een privé
  `_static_roots()` in serve.py die precies dat samenstelt (core-static + elke DS
  z'n `static_path`). Kopieer die helper.
- De `<head>` moet de CSS-links + de **`<script type="module">`** van de bundle
  bevatten. In productie levert de jinja-global **`get_design_system_assets()`** dat
  per actief design system (leest `css_urls`/`js_urls`/`extra_head`). NLDD's JS is
  een ES-module (Lit), dus die gaat via `js_urls` → `<script type=module>`, niet als
  gewone `<script>`.

**In de test wachten tot upgrade** (het recept uit onze shoot-scripts):
```js
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1200); // laat de module registreren
try {
  await page.waitForFunction(
    () => !document.querySelector('nldd-form-field:not(:defined), nldd-text-field:not(:defined)'),
    { timeout: 8000 });
} catch {}
await page.waitForTimeout(600); // settle
```
Pas de selector aan op de `nldd-*` die op de pagina staan. Zonder deze wacht is je
baseline gegarandeerd flaky (soms vóór, soms ná hydratie geschoten).

## 3. Restlijst tegen de registry (op `26ab110`)

| jullie item | bestaat nu? | juiste naam / advies |
| --- | --- | --- |
| `ul` (40), `li` (15) | als component: **nee**; als HTML: **ja** | Raw `<ul><li>` gaat **ongewijzigd** door de pijplijn (geverifieerd) en werkt onder elk thema. MAAR jullie `c-ul`/`c-li` kwamen uit roos mét `rvo-item-list`-styling; die styling krijg je met raw `<ul>` niet. Er is nog **geen** thema-agnostische gestylede lijst (NLDD heeft wel `c-list`/`c-list-item`, maar nldd-only). **Dus: nog steeds een gat als je de RVO-lijststyling wilt** — kandidaat voor een kleine set/core-toevoeging (zelfde patroon als lotc-forms). Wil je puur functioneel, gebruik raw `<ul>`. |
| `td` `tr` `th` `thead` `tbody` (22) | deels | Raw `<table>…` gaat ook ongewijzigd door (werkt). Voor **RVO-getstylede** tabellen is er een core-set: `c-table` + `c-table-head` + `c-table-row` + `c-th` + `c-td` (RVO+NLDD). **Let op de namen**: het is `c-table-head`/`c-table-row` (géén `c-thead`/`c-tbody`/`c-tr`); `c-th`/`c-td` bestaan wél. Dus 1-op-1 rename werkt niet voor `tr/thead/tbody` — die map je naar `table-row`/`table-head` of laat je raw. |
| `fieldset` (9) | **ja** | `c-fieldset` (lotc-forms) |
| `action-group` (8) | **ja** | `c-action-group` (lotc-forms) |
| `text-input-field` (28) | **ja** | `c-text-input-field` (lotc-forms) |
| `select-field` (5) | **ja** | `c-select-field` (lotc-forms) |
| `secret-field` (9) | **nee** | Echt gat. Geen veld (jullie eigen correctie), maar een **weergave**component (sleutel afgeschermd tonen + onthul-knop). `password-field` is iets anders (een invoerveld). Aparte beslissing: als display-component toe te voegen (universeel + thema-mening → voldoet aan het criterium), maar nog niet gebouwd. Zeg of je 'm nodig hebt, dan wegen we 'm. |
| `menubar` (10) | **ja, andere naam** | `<c-menu type="bar">` (core; het losse `c-menu-bar` is vervangen door de `type`-variant). `menu`-`type` = `horizontal\|vertical\|bar`. |

**"Waren ul/li het echte gat — klopt dat nog?"** Grotendeels ja: van je hele
restlijst zijn `fieldset/action-group/text-input-field/select-field` nu gedekt
(lotc-forms) en `menubar` is `c-menu type=bar`. Wat overblijft als **echte** gaten:
1. **Gestylede lijsten** (`ul`/`li` met `rvo-item-list`) — thema-agnostische lijst
   bestaat nog niet; raw HTML werkt functioneel wél.
2. **`secret-field`** — display-component, nog te bouwen/beslissen.
De tabel-primitieven zijn géén gat (raw HTML of de `c-table`-set), let alleen op de
naamsverschillen (`tr/thead/tbody` → `table-row/table-head` of raw).

## Wat wij van jullie kunnen gebruiken

- Als je de **gestylede lijst** en/of **secret-field** nodig hebt voor de omzetting:
  zeg het, plus of het RVO-fidelity moet zijn — dan bouwen we ze net als lotc-forms
  (per-thema), en jullie roos `ul.html.j2`/`list.html.j2` als vertrekpunt voor de
  RVO-kant zijn welkom.
- Voor de RVO-fidelity van lotc-forms wachten we nog op jullie
  `widgets/_macros.html.j2` (eerder aangeboden) — daarmee trekken we de RVO-veld-
  output strak naar jullie werkelijke markup.

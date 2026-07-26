# Plan v7 — LOTC: thema-agnostische compiler + performance-rewrite

**Voor:** een autonome Claude die dit zelfstandig uitvoert, fase voor fase, met groene tests na elke stap.
**Werkdirectory:** `/Users/robbertuittenbroek/IdeaProjects/lord-of-the-components`
**Lokale referentie-repos:**
`../jinja-roos-components` — de langzame voorganger; 74 bewezen `.html.j2` templates = **CSS-waarheid voor RVO**
`../rvo` — `@nl-rvo/design-system` (de "ROOS"-source die je zocht), 68 componenten, React + SCSS + tokens
`../storybook` — `@nldd/design-system` 0.8.70, Lit web components, 118 tags, met `custom-elements.json`

**Vastgelegde beslissingen (uit overleg):**
1. **`name` → `label`** voor zichtbare tekst; `name` wordt uitsluitend de HTML-veldnaam. Eenmalige breaking change, vroeg in het traject.
2. **Thema-id is `nldd`**, geen alias. `theme="nlds"` geeft een duidelijke foutmelding met suggestie.
3. **RVO-oracle wordt gebouwd vóór de commons-sweep** (React SSR → verwachte HTML → diff).

---

## 1. Context

LOTC heeft de goede *architectuur* (semantische definities → declaratieve implementatie-IR → gegenereerde
templates) en een stevig vangnet (1012 pytests, 13 visuele tests, 24 componenten). Drie dingen ontbreken.

### 1.1 Snelheid — het is nu langzamer dan de voorganger

Gemeten op deze machine (Python 3.11.8, Jinja2 3.1.5):

| Pad | Kosten | Toelichting |
|---|---|---|
| Warme render, huidige `<c-button>` | **81 µs / component** | 500 buttons = 42 ms per render |
| Compile/preprocess, huidig | **284 µs / component** | 500 buttons = 148 ms, superlineair |
| ...waarvan BeautifulSoup-parse | 5,5 ms / 500 tags | slechts 4% — de rest is LOTC's eigen O(n²)-werk |
| Vereenvoudigde `{% include %}` | 6,3 µs | includes zijn **niet** de hoofdoorzaak |
| Jinja `{% macro %}`-call | 3,6 µs | |
| **Gegenereerde Python-renderer, vanuit Jinja** | **2,3 µs** | 35× sneller dan nu |
| Pure Python-renderer | 0,83 µs | |
| **Constant-folded statische HTML** | **~0 µs** | gratis |

Vier concrete oorzaken:

- **`render_extra_attributes` in `_generic_attributes.j2` kost ~40 µs per component-instantie — ca. 60% van
  een button-render.** Het loopt ~70 sequentiële `{% if %}`-checks af (elk mouse/keyboard/focus/form/touch/
  drag/clipboard/media/window-event) plus 4 volledige `for key, value in component_context.items()`-lussen,
  voor elk component, bij elke render, ook als de context 2 sleutels heeft.
- 2 `{% import %}` per instantie (13,5 µs), 42 `{% set %}` met `dict.get`, klasselijsten via
  list-concatenatie (`css_classes = css_classes + ['x']`, nieuwe lijst per regel).
- Preprocess: `_find_tag_location` doet **per component een regex over de volledige source plus een
  `split("\n")`** — puur voor foutmeldingen, ook op het succespad. En `_restore_jinja_tags` is
  O(N²·len): tot `10 × N` substring-searches en N volledige `.replace()`-copies over een groeiende buffer.
- **En de killer in de praktijk:** `examples/getting-started/app.py:48` en `tests/visual/serve.py:86`
  gebruiken `env.from_string(...)` **per request**. Dat omzeilt `Environment.cache` volledig, dus
  BeautifulSoup + volledige hercompilatie loopt bij élke HTTP-request. 8,3 ms voor een template van 1,6 kB;
  13,4 ms preprocess voor de showcase.

### 1.2 Thema's — die bestaan niet

`theme="rvo"` zet één body-class (`rvo-theme`) en dat is alles. Alle 21 implementaties bevatten
hardgecodeerde `rvo-*`/`utrecht-*` literals (card 41×, link 35×, alert 25×, button 24×). Verder structureel
RVO: `header.impl.ts` bevat een letterlijke `RIJKSOVERHEID_SVG`, `alert.impl.ts` mapt statussen naar
**Nederlandse** iconnamen, `card.impl.ts` heeft `aria-label="Delta naar rechts"`. `page.html.j2` heeft 7 CSS-
en 2 JS-URL's als absolute literals. Er is geen `theme`-veld in `ComponentImplementation`, geen per-thema
directory, geen klasse-indirectie. `VALUES.THEMES` bestaat maar wordt door geen enkel bestand gebruikt.

### 1.3 Dekking — de commons ontbreken

24 componenten, en juist het belangrijkste mist: **geen enkel formuliercomponent, geen basis-HTML-elementen,
geen tabel.** `jinja-roos-components` had 74 templates. Bovendien zijn twee features *gedeclareerd maar niet
geïmplementeerd*: `<c-menu :items="data"/>` parseert en valideert, maar **geen template leest `items`** — de
binding doet stil niets. Hetzelfde voor named slots (`<template slot="...">`): `_build_include` schrijft
`"slots": {...}` weg, maar geen enkel template leest het.

### 1.4 Blokkerende pre-existente bug

**`npm run build:fe` werkt niet.** `webpack.config.cjs:57` verwijst naar `page.html.j2.webpack`, dat in plan
v6 (T-B5) is verwijderd. Tegelijk staat `python/src/lord_of_the_components/static/` in `.gitignore`. Een
verse clone heeft dus **geen CSS én geen manier om die te bouwen**. Dit moet als eerste gefixt worden,
anders kan niets visueel geverifieerd worden.

**Doel van dit plan:** dezelfde `<c-page>`-ervaring, maar (a) 10–40× sneller met meetbare regressiebewaking,
(b) `theme="rvo"` / `theme="nldd"` echt werkend, (c) alle commons gedekt in beide thema's waar dat kan,
(d) geverifieerd met pytest, een RVO-oracle én Playwright-screenshots per thema.

**Werkwijze:** eerst het **overzicht** — één gegenereerde variantmatrix van alle componenten met al hun
attributen en waarden (F1), die tegelijk de goldens, de Playwright-fixtures, de docs en het dekkingsrapport
voedt. Daarna een smal pilotpad van 6 componenten volledig af — parser, renderer, folding, slots/bindings,
thema, browsercontrole. Pas als dat groen en snel is, de brede sweep in batches van ±6, waarbij de
dekkingspoort voorkomt dat er stil gaten vallen.

---

## 2. Wat al goed is — hergebruiken, niet opnieuw bouwen

| Bestaand | Pad | Waarom hergebruiken |
|---|---|---|
| Semantische definities | `definitions/component.ts`, `definitions/components/*.def.ts` | `defineComponent()` met props/values/events/bindings/children is precies wat `planprompt.md` vroeg. Structuur blijft. |
| Prop/value-woordenboeken | `definitions/props.ts` (~90 entries), `values.ts` (42 enums), `events.ts`, `bindings.ts` | `PROPS` heeft form-props (`MIN`, `MAX`, `PATTERN`, `AUTOCOMPLETE`, …) al gereserveerd; `bindings.ts` heeft `MenuItem`, `SelectOption`, `TableColumn`, `TableRow`, `ProgressStep`, `TabItem` al getypeerd. |
| **Element-tree-IR** | `implementations/implementation.ts` (`ElementNode`, `ClassRule`, `Condition`, `AttributeMapping`, `ComputedVariable`, `valueMaps`, `guard`) | De kern. Declaratief, recursief, target-onafhankelijk. Werkt óók voor NLDD: element = custom tag, props → attributen, slots → children; de klasse-regels blijven dan simpelweg leeg. Niet vervangen — zuiveren en uitbreiden (§4, F3/F6). |
| Jinja-emitter | `core/src/generators/jinja2/index.ts` (631 r., `Jinja2Generator`) | Blijft als **referentie-backend** voor diffen/debuggen naast de nieuwe Python-emitter. |
| Registry-/showcase-generator | `core/src/generators/jinja2/generate-registry.ts`, `generate-showcase.ts` (613 r.) | Showcase levert gratis variantdekking voor visuele fixtures. |
| Testnet | `python/tests/*_e2e.py` — 1012 tests | Asserties zijn substring/klasse-gebaseerd en whitespace-ongevoelig → ze blijven geldig na de rewrite. **Let op:** ze pinnen ~600× RVO-klassenamen, dus ze zijn het RVO-contract; NLDD krijgt eigen tests, niet dezelfde geparameteriseerd. |
| Visuele opzet | `tests/visual/{serve.py,playwright.config.ts,specs/components.spec.ts}` | Alleen een thema-dimensie toevoegen. |
| IDE-metadata-generatoren | `core/src/generators/ide/{web-types.ts,vscode-custom-data.ts}` | Levert de "sublime UX" uit `planprompt.md`. Nu gekoppeld aan het dode KDL-type; omhangen naar `definitions/`. |
| Prior art voor thema's | `core/src/types/themes.ts` + `loader/theme-loader.ts` + `resolver/token-resolver.ts` | Dood (leest verwijderde `.kdl`), maar **eerst lezen** vóór verwijderen: hier stond de enige echte multi-thema-opzet (theme met `extends`, tokens, per-framework connectors). |

---

## 3. Doelarchitectuur

```
definitions/*.def.ts                    semantisch, thema-onafhankelijk (props, values, events, bindings, children)
        │
        ├── themes/rvo/components/*.impl.ts     ElementNode-tree → RVO/Utrecht CSS-klassen
        └── themes/nldd/components/*.impl.ts    ElementNode-tree → <nldd-*> tags + attributen + slots
        │
   [ codegen — TypeScript, offline, `npm run generate` ]
        │
        ├──> python/src/lord_of_the_components/themes/<id>/renderers.py   ← GEGENEREERDE Python-functies  ★ hot path
        ├──> python/src/lord_of_the_components/themes/<id>/assets.json    ← CSS/JS per thema
        ├──> python/src/lord_of_the_components/registry.json              ← runtime-validatie (enige bron)
        ├──> python/src/.../templates/components/*.html.j2                ← referentie-backend (debug/diff)
        ├──> ide/<id>/{web-types.json,html-custom-data.json}
        └──> THEME-COVERAGE.md                                           ← welke prop-waarde in welk thema bestaat
```

Runtime (Jinja2-extensie):

```
<c-button type="primary" label="Opslaan"/>
   │  parser.py — één pass, geen BeautifulSoup, Jinja-regio's ondoorzichtig
   │
   ├─ alle attributen literal?  ──ja──►  renderer NU aanroepen (compile-time) → letterlijke HTML in de template
   │                                     → 0 µs per render
   └─ anders ─────────────────────────►  `{{ _lotc_rvo_button(type=…, label=…) }}`
                                         → 2,3 µs per render
```

Beide paden roepen **dezelfde** gegenereerde Python-functie aan → één waarheid, geen dubbele logica.
Nesting componeert: `_lotc_rvo_card(content=_lotc_rvo_button(…))`. Een volledig statische subtree klapt
samen tot één string.

### Ontwerpbesluiten

| # | Besluit | Reden |
|---|---|---|
| D1 | IR blijft `ElementNode`; er komt een **tweede backend** (IR → Python) naast de bestaande (IR → Jinja-tekst). | Vervult "logica één keer schrijven, meerdere targets" uit `planprompt.md`. Een Java-/React-backend is later een nieuwe emitter, geen nieuwe componentbibliotheek. |
| D2 | **Thema wordt op compile-time gebonden.** `setup_components(env, theme="rvo")` zet de default; een *literal* `<c-page theme="nldd">` overrulet voor die template. Een dynamische `:theme` valt terug op runtime-dispatch (folding uit, gedocumenteerd langzamer). | Maakt constant folding en directe globals mogelijk. Praktisch kiest een app zijn thema bij het opstarten. |
| D3 | Renderers staan als **directe Jinja-globals** met gemangelde naam: `_lotc_rvo_button`, `_lotc_nldd_button`. | Globale lookup is sneller dan attribuutaccess; twee thema's kunnen naast elkaar in één env bestaan. |
| D4 | Gegenereerde renderers retourneren `Markup`; prop-waarden via `markupsafe.escape`, `content` is al `Markup`. | Repareert het XSS-gat: `{{ children if children else name | safe }}` markeert nú *gebruikersdata* als safe. |
| D5 | De **parser normaliseert HTML nooit.** Niet-component-tekst wordt als slice van de originele source doorgegeven. | BeautifulSoup lowercast attribuutnamen, herschrijft HTML, en `_restore_jinja_tags` doet `html.unescape()` over de *hele* output — dat sloopt `&amp;` in gebruikerscontent. |
| D6 | `registry.json` is de **enige** bron van componentmetadata. `ComponentRegistry._register_default_components()` (315 regels verouderde camelCase `fullWidth`/`variant`, plus `layout`/`stack` die geen template meer hebben) wordt verwijderd. | Nu geeft `ComponentRegistry()` zonder pad andere props dan de gegenereerde templates → stille breuk. |
| D7 | Thema's declareren **capabilities**; onbekende combinaties zijn expliciet. | RVO heeft utility-klassen (`margin`/`padding`/`text-style`), NLDD niet (dat gebruikt `nldd-container`/`nldd-spacer`). Onbekende enum-waarde per thema → `THEME-COVERAGE.md` + build-fout tenzij expliciet `unsupported`. |
| D8 | De extensie wordt **stateless per compile.** | Nu zijn `_jinja_placeholders`, `_placeholder_counter`, `_current_source`, `_tag_occurrence_counts` instance-attributen op één extensie-instantie die de hele Environment deelt. Bij een threaded server corrupten gelijktijdige compiles elkaar. Geen locks aanwezig. |
| D9 | RVO-fidelity wordt **machinaal geverifieerd** via een React-SSR-oracle. | De helft van de RVO-klassen komt uit `@utrecht/component-library-react`, niet uit de RVO-`.tsx`. Handmatig overnemen over 50+ componenten geeft stille afwijkingen. |

### Escaping- en autoescape-regels (nu inconsistent — vastleggen)

- `setup_components()` **eist** `env.autoescape` truthy, anders een duidelijke `RuntimeError` met uitleg
  (nu staat `python/tests/conftest.py` op autoescape=False → gebruikersdata wordt niet ge-escaped).
- Prop-waarden → `escape()`. `content`/slots → al `Markup` (door child-renderers geproduceerd).
- Alleen props die in de definitie `raw: true` hebben (zoals `head` op `<c-page>`) gaan ongefilterd door.
- Events (`@click`) → `on*`-attributen met attribuut-escaping van de JS-string. Functioneel gelijk aan nu,
  maar bewust en gedocumenteerd.

---

## 4. Fasen

Elke fase eindigt met: `pytest` groen, benchmark gelogd, één commit. **Ga niet naar de volgende fase met
rode tests.** Commitberichten: nooit Claude/Anthropic/AI vermelden, geen Co-Authored-By-trailer.

---

### F0 — Reparaties, meetlat en hygiëne (geen gedragswijziging aan de output)

**T0.1 Repareer de frontend-build (blokkerend, eerst doen).**
`webpack.config.cjs:57` verwijst naar het verwijderde `page.html.j2.webpack`. Kies één van twee en documenteer
de keuze: (a) herstel het bronbestand uit git (`git show ffac8a9^:python/src/lord_of_the_components/templates/components/page.html.j2.webpack`),
of (b) beter — verwijder `HtmlWebpackPlugin` en laat webpack alleen een **`assets.json`-manifest** emitteren
dat de codegen inleest (dat is toch de eindsituatie in F6). Kies (b).
Haal daarna `python/src/lord_of_the_components/static/` uit `.gitignore` óf voeg een `npm run build:fe`-stap
toe aan CI en aan `README`-installatie, zodat een verse clone werkt. Verifieer: `npm run build:fe` slaagt en
`dist/` bevat CSS.

**T0.2 Template-caching: `from_string` → `get_template`.**
`examples/getting-started/app.py:48` en `tests/visual/serve.py:86` hercompileren élke request. Vervang door
een `FileSystemLoader` + `env.get_template(name)` en zet `auto_reload=False` in productiemodus (levert nog
~8–10% extra op doordat de `os.stat` per include per render verdwijnt). Dit is de goedkoopste grote winst in
het hele plan.

**T0.3 Extensie stateless maken (D8).** Verplaats de per-compile state naar een lokaal object dat door
`preprocess()` wordt aangemaakt en doorgegeven. Voeg een test toe die twee templates *gelijktijdig*
compileert in threads en verifieert dat de output correct is.

**T0.4 Registry-drift repareren (D6).** Verwijder `_register_default_components()` uit
`python/src/lord_of_the_components/registry.py`; `ComponentRegistry()` laadt default de meegeleverde
`registry.json`; cache die op moduleniveau (nu doet elke `setup_components()` een verse `json.load` van
32,7 kB). Vervang de lineaire `ComponentDefinition.get_attribute()` door een dict-index. Werk
`test_registry.py` bij.

**T0.5 Benchmarkharnas** — nieuw `python/benchmarks/bench.py`.
Scenario's: `single_button`, `buttons_500`, `form_page_30_fields`, `table_50x8`, `showcase_page`,
`full_c_page`, `static_only_page` (alles literal), `dynamic_page` (alles via `{{ }}`/`:bindings`),
`nesting_depth_16`, `cold_start` (nieuwe env + eerste render).
Meet per scenario: `preprocess_ms`, `first_render_ms`, `warm_render_ms` (min van N=30), `output_bytes`,
afgeleid `us_per_component`. Output: JSON in `python/benchmarks/results/<git-sha>.json`. `--baseline`
vergelijkt met `python/benchmarks/baseline.json`, exit 1 bij >10% regressie. Nu `--write-baseline` draaien.

**T0.6 CI compleet maken.** `.github/workflows/visual-tests.yml` draait alleen Playwright — geen pytest.
Voeg jobs toe: `pytest` (met coverage-gate), `mypy`, `ruff`, `npm run build -w core`, `npm run build:fe`,
en `bench.py --baseline`.

**T0.7 Twee concurrerende packaging-configs opruimen.** Root `pyproject.toml` (hatchling,
`testpaths=["python/tests"]`) vs `python/pyproject.toml` (setuptools, coverage-gate 95%). Houd er één —
`python/pyproject.toml` is degene die `pip install -e python/` gebruikt.

**Verificatie F0:** `cd python && pytest` groen; `npm run build:fe` slaagt; `python benchmarks/bench.py
--write-baseline`; een request op `app.py` is meetbaar sneller (verwacht: 8,3 ms → <1 ms voor de tweede request).

---

### F1 — Variantmatrix, componentoverzicht, `label`-rename en het golden-contract

> **Dit is de "overzichtsvorm eerst"-fase.** Voordat er iets herschreven wordt, komt er één machine-leesbare
> waarheid over *welke componenten er zijn en welke attributen met welke waarden bestaan* — en daaruit
> volgen automatisch de goldens, de Playwright-fixtures, de docs en het dekkingsrapport. Eén enumerator,
> vier afnemers. Hand-gecureerde lijsten verouderen; deze niet.

**T1.0 De variantmatrix — één enumerator, vier afnemers.**

Nieuw `core/src/matrix/index.ts`: leest `definitions/` + `themes/` en produceert één canonieke lijst van
*cases*. Per component:
- elke enum-prop × elke toegestane waarde (inclusief de default, expliciet gemarkeerd)
- elke boolean-prop aan én uit
- elke vrije-tekst-prop met een representatieve waarde plus een edge-case (`&`, `<script>`, lange tekst,
  leeg)
- de zinvolle combinaties die de implementatie echt onderscheidt (bv. button `show-icon` × `icon` × `size`;
  card `image` × `inline-image` × `layout`) — afgeleid uit de `ClassRule`/`Condition`-bomen in de impl, niet
  uit een handmatige lijst: elke `eq`-waarde en elke `when`-conditie die in de IR voorkomt moet minstens
  één case hebben
- content aanwezig / afwezig, en één geneste variant
- per case: welke thema's hem ondersteunen (`unsupported` uit T6.6 wordt hier gerespecteerd)

Output: `core/dist/matrix.json` — `{component, case_id, theme, markup, props, covers: ["type=primary", …]}`.
Dit bestand is de bron voor:

| Afnemer | Wat het ermee doet | Taak |
|---|---|---|
| **Goldens** | `python/tools/gen_goldens.py` rendert elke case → `python/tests/golden/<theme>/<component>/<case_id>.html` | T1.1 |
| **Playwright-fixtures** | één fixture per component per thema, met elke case als los gelabeld blok | F7 |
| **Componentoverzicht (docs)** | `COMPONENTS.md` + een HTML-galerij per thema | T1.0b |
| **Dekkingsrapport** | welke prop×waarde géén golden én géén snapshot heeft → build-fout | T1.0c |

**T1.0b Componentoverzicht — `COMPONENTS.md` (gegenereerd, gecommit).**
Per categorie een tabel per component:

```
## button  (actions)          rvo ✅   nldd ✅
| prop        | type    | waarden                                    | default   | verplicht |
|-------------|---------|--------------------------------------------|-----------|-----------|
| type        | enum    | primary secondary tertiary quaternary      | primary   |           |
|             |         | subtle warning warning-subtle              |           |           |
|             |         |   ⚠ nldd: quaternary → unsupported         |           |           |
| size        | enum    | xs sm md                                   | md        |           |
| label       | string  | —                                          |           | ✓         |
| show-icon   | enum    | no before after                            | no        |           |
| disabled    | boolean | presence                                   | false     |           |
events:    @click @focus @blur          bindings: —
content:   ja (overschrijft label)      children: —
JS nodig:  nee (rvo) / ja (nldd)
```
Plus bovenaan één **overzichtstabel van álle componenten**: naam, categorie, aantal props, events, bindings,
child-componenten, rvo/nldd-support, JS-vereist, backend (`python`/`jinja`). Dat is de kaart waarmee de
autonome Claude en jij in één oogopslag zien waar de sweep staat.

Naast de markdown ook een **HTML-galerij per thema** (`showcase/<theme>/index.html`): elke component met
elke case, met de gebruikte markup zichtbaar naast het resultaat. Dit is tegelijk de Playwright-fixture
(F7), de handmatige controlepagina, en de bron voor de IDE-voorbeelden (T10.3). De bestaande
`generate-showcase.ts` (613 r.) is hiervoor het startpunt — die doet dit al deels met custom generators per
component; die custom generators vervangen door de matrix uit T1.0, zodat er geen hand-onderhouden lijst
overblijft.

**T1.0c Dekkingsrapport — `COVERAGE.md` (gegenereerd) + build-poort.**
Per component per thema: welke prop×waarde-combinaties gedekt zijn door (a) een golden, (b) een
Playwright-snapshot, (c) een RVO-oracle-case (F8). Een enum-waarde of `Condition` in de IR met **nul**
dekking is een build-fout, tenzij expliciet uitgezonderd met reden. Zo kan de sweep in F9 niet stil gaten
laten vallen.

**T1.1 Goldens vastleggen op de huidige output** (vóór de rename, zodat de rename bewijsbaar niets verandert).
- Generator `python/tools/gen_goldens.py`: leest `matrix.json` (T1.0) en rendert elke case →
  `python/tests/golden/<theme>/<component>/<case_id>.html`.
- Vergelijker `python/tools/htmlnorm.py`: parse, klassen sorteren, attributen sorteren, whitespace tussen
  block-tags normaliseren. **Vergelijk genormaliseerd, niet byte-voor-byte** — de nieuwe renderer emit
  compacte HTML zonder de huidige 4-spaties-indentatie.
- `python/tests/test_golden.py` loopt over alle goldens. Dit is het contract voor de hele rewrite.

**T1.2 `name` → `label`.**
- `definitions/props.ts`: `LABEL: "label"` bestaat al; voeg `FIELD_NAME`/behoud `NAME: "name"` voor de
  HTML-veldnaam.
- Wijzig in alle `.def.ts` waar `name` zichtbare tekst is: button, heading, paragraph, link, label, strong,
  em, menu-item, breadcrumbs-item, footer, header (`text`), hero.
- Wijzig de bijbehorende `.impl.ts` `text`-verwijzingen mee.
- Registry geeft bij `name=` op zo'n component een `ComponentError` met suggestie `label`.
- Werk de ~600 testasserties, alle `tests/visual/fixtures/*.html`, `examples/getting-started/templates/*`
  en de showcase-generator bij. Doe dit met een script + handmatige review, niet puur met sed.

**T1.3 Bewijs.** Regenereer de golden-*inputs* met `label=`; de golden-*outputs* moeten **byte-identiek**
blijven aan T1.1. Wijkt er iets af, dan is dat een echte fout die je nu vindt in plaats van later.

**T1.4 Bugs vastleggen als falende/`xfail`-tests** (fix volgt in de fase die die code herschrijft):
- `&amp;` in een prop-waarde of content overleeft de render niet (`html.unescape()` over de hele output,
  `extension.py:577`).
- `<c-button label="<script>alert(1)</script>"/>` wordt niet ge-escaped (`| safe` op de tekst-prop).
- Hoofdletters in attribuutnamen en willekeurige HTML worden door BeautifulSoup genormaliseerd.
- `<img></img>`: de generator zet sluittags op void-elementen (`card.html.j2:47-51` e.a.).

**Verificatie F1:** goldens byte-identiek vóór/na de rename; 1012 tests groen; benchmark ongewijzigd.

---

### F2 — Nieuwe parser (`parser.py`), gedrag identiek

De output blijft in deze fase nog `{% set _component_context %}{% include %}` — zo bewijst F2 zich puur op
de goldens.

**T2.1** Nieuw `python/src/lord_of_the_components/parser.py`:
- `parse(source: str) -> list[Node]` met `TextNode(span)` en `ComponentNode(name, attrs, children, span)`;
  `attrs` = lijst van `Attr(name, raw_value, kind, span)` met
  `kind ∈ {LITERAL, INTERPOLATED, BLOCK, EXPRESSION, EVENT}`.
- Scanner herkent `<c-`, `</c-`, `{{ … }}`, `{% … %}`, `{# … #}`, `<!-- -->`, `<script>`, `<style>`.
  **Jinja-regio's zijn ondoorzichtig:** overslaan, nooit als HTML parsen, nooit (un)escapen.
- Attribuut-statemachine binnen de tag: naam, optioneel `=`, waarde in `"` of `'` die zelf Jinja-regio's mag
  bevatten. Waarde zonder `=` → booleaanse presence.
- Kind-bepaling: geen Jinja → `LITERAL`; alleen `{{ }}` → `INTERPOLATED`; bevat `{% %}` → `BLOCK`;
  naam begint met `:` → `EXPRESSION`; met `@` → `EVENT`.
- **Foutlocaties lui:** bouw één keer een array van regelbegin-offsets, `bisect` pas bij het gooien van een
  fout. Geen regex over de hele source per component. (284 µs → doel <25 µs.)
- Niet-component-tekst = slice van de originele source, ongewijzigd.
- Void-elementen krijgen geen sluittag.

**T2.2** `extension.py` afslanken: `parse()` → boom bottom-up → emitteren → één `''.join()`.
Verwijder `_find_tag_location`, `_find_attribute_location`, `_restore_jinja_tags`,
`_process_components_in_soup` (de O(n²)-graafopbouw en de dubbele diepte-pass), `_generate_id`
(sha256 per instantie → simpele counter) en de BeautifulSoup-afhankelijkheid.
Behoud: validatie, foutmeldingen met `get_close_matches`-suggesties, nesting-limiet, slot-extractie.
Maak de logging lui (`logger.debug("… %s", x)` i.p.v. eager f-strings) en haal de function-local imports
(`import html`, `import os`) uit de hot path.

**T2.3** Nieuw `python/tests/test_parser.py` — minimaal: Jinja in attribuutwaarde
(`label="{% trans %}Opslaan{% endtrans %}"`), `{% if %}` rond een component, `{% for %}` met component in de
body, HTML-commentaar met `<c-`-tekst erin, `<script>`-inhoud met `<`, entiteiten (`&amp;`, `&nbsp;`) blijven
intact, self-closing vs. gepaard, niet-gesloten tag → fout met juiste regel/kolom, verkeerd gesloten tag →
fout, dubbel attribuut → fout, `:`/`@`-prefixen, attribuut zonder waarde, hoofdletters in attribuutnaam
(bewust gedrag kiezen en testen), 10 lagen nesting, lege template, template zonder `<c-`.

**Verificatie F2:** goldens genormaliseerd identiek — de entity-`xfail` uit T1.4 wordt nu `pass`;
1012 tests groen; `bench.py` toont preprocess ≥5× sneller.

---

### F3 — Python-renderer-backend voor 6 pilotcomponenten

Pilot: **button, heading, paragraph, link, icon, layout-flow**. Dekt statische klassen, pattern-klassen,
conditionele klassen, dynamisch element (heading → h1..h6), booleans, content/children en nesting.

**T3.1 IR zuiveren.** Vervang `ElementNode.text?: string` (nu met Jinja erin, 31 plekken —
`grep -n 'text: "' implementations/components/*.impl.ts`) door een expressie-IR:
```ts
export type TextNode =
  | { literal: string }
  | { prop: string }            // ge-escaped
  | { content: true }           // component-content, al Markup
  | { coalesce: TextNode[] }    // eerste truthy
  | { raw: string };            // expliciet vertrouwd (alleen `head` e.d.)
```
`{{ children if children else name | safe }}` wordt `{ coalesce: [{content:true},{prop:"label"}] }`.
Voeg tegelijk een **`wrapper`-primitief** toe: een node die zijn children *omhult* als `when` waar is en ze
anders ongewijzigd doorgeeft. Nu dwingt `elseChildren` (dat siblings vervángt) tot copy-paste — in
`card.impl.ts` staat de hele `rvo-card__content`-subtree (~55 regels) twee keer, en in het gegenereerde
`card.html.j2` ook (regels 72-107 vs 116-151).
Los ook de gedeelde `css_classes`-variabele op: `core/src/generators/jinja2/index.ts:327` heeft
`const classVar = isRootNode ? "css_classes" : "css_classes"` met een comment dat unieke namen bedoeld
waren — geef elke node-diepte een eigen naam.
**Belangrijk:** de IR-types staan op twee plekken (`implementations/implementation.ts` én
`core/src/generators/jinja2/index.ts:20-115`). Consolideer naar één plek (`core/src/ir/`), en laat beide
emitters daaruit importeren.

**T3.2 Python-emitter** — nieuw `core/src/generators/python/index.ts`. Vorm per component:
```python
_BTN_TYPE = {'primary': ' utrecht-button--primary-action',
             'warning': ' utrecht-button--primary-action utrecht-button--warning', ...}

def button(*, type='primary', size='md', label='', content=None, disabled=False,
           html_type='button', _extra=None, _class=''):
    cls = 'utrecht-button' + _BTN_TYPE.get(type, '') + _BTN_SIZE.get(size, '')
    ...
    return Markup(''.join(parts))
```
Emitter-regels:
- keyword-only parameters, naam = prop met `-` → `_`; defaults uit de definitie.
- enum → **module-level dict lookup**, niet een if-keten; boolean → `if`.
- `_extra` is één dict met `data-*`/`aria-*`/`hx-*`/`id`/`title`/`style`/`role`/`tabindex` en events; **één
  lus** die ` k="v"` bouwt. Dit vervangt de 40 µs-macro uit §1.1 volledig.
- utility-klassen (`text-style`/`margin`/`padding`) worden **thema-eigen** gegenereerde code, niet meer een
  gedeelde Jinja-macro (D7).
- `''.join(parts)` met een platte lijst; geen tussenliggende lijst-concatenaties.
- Deterministische output (zelfde input → zelfde bytes) zodat gegenereerde bestanden leesbaar diffen.
- Void-elementen zonder sluittag.

**T3.3 Runtime-helpers** — nieuw `python/src/lord_of_the_components/runtime.py`: `esc`
(= `markupsafe.escape`), `Markup`, `render_extra(d) -> str`, `merge_class(base, extra)`. Klein en heet: geen
imports in functiebodies.

**T3.4 Incrementele omschakeling.** `registry.json` krijgt per component `"backend": "python" | "jinja"`.
De extensie emitteert voor `python`-componenten `{{ _lotc_<theme>_<naam>(…) }}` en voor de rest het oude
include-pad. Zet alleen de 6 pilotcomponenten op `python`. Zo blijven alle 1012 tests continu groen.

Attribuutwaarden → argumenten:
| Kind | Emissie |
|---|---|
| `LITERAL` | Python-string-literal in de call |
| `INTERPOLATED` (`"x {{ y }} z"`) | `'x ' ~ (y) ~ ' z'` |
| `BLOCK` (`{% trans %}`) | `{% set _lotc_aN %}…{% endset %}` ervoor, dan `label=_lotc_aN` |
| `EXPRESSION` (`:items="items"`) | direct `items=items`. `:items="{{ items }}"` → duidelijke foutmelding met de juiste vorm |
| `EVENT` (`@click="f()"`) | in `_extra` als `onclick` |
| content/slots | `{% set _lotc_cN %}…{% endset %}` → `content=_lotc_cN` |

**T3.5 Generator-tests.** Er zijn nu **nul** tests voor `Jinja2Generator` — de module die élk template
produceert. Voeg unit-tests toe voor beide emitters: elke `ClassRule`-variant, elke `Condition`-variant,
`valueMap`, `guard`, `filter`, dynamisch element, `wrapper`, void-elementen, en snapshot-tests op de
gegenereerde `renderers.py`.

**Verificatie F3:** goldens van de 6 genormaliseerd identiek; de XSS- en `&amp;`-`xfail`s worden `pass`;
1012 tests groen; `bench.py`: `buttons_500` warme render ≤ 3 ms (was 42 ms).

---

### F4 — Constant folding

**T4.1** Als élk attribuut `LITERAL` is én alle content al gefold is tot een string: roep de renderer op
**compile-time** aan en zet de resulterende HTML letterlijk in de template-source.
- Guard: bevat de gefolde HTML `{{`, `{%` of `{#`, wrap dan in `{% raw %}…{% endraw %}`.
- Statisch kind in dynamische ouder → `{% set _lotc_cN %}<letterlijke html>{% endset %}` en dat als
  `content=` doorgeven.
- Schakelaar `setup_components(..., fold=True)` (default `True`); `fold=False` om te debuggen.

**T4.2** `python/tests/test_folding.py`: gefold vs. ongefold moet **identieke** output geven voor élke
golden-case (parameteriseer `test_golden.py` over `fold=True/False`). Plus expliciete tests voor de
`{% raw %}`-guard en voor gemengd statisch/dynamisch nesten.

**Verificatie F4:** `bench.py`: `static_only_page` en `buttons_500` warme render ≈ 0 ms;
`dynamic_page` ≤ 3 ms. Goldens onveranderd in beide standen.

---

### F5 — Slots en bindings echt laten werken

Dit zijn gedeclareerde-maar-niet-bestaande features, en ze zijn nodig vóór de forms/tabel-sweep
(`<c-select :options>`, `<c-table :columns :rows>`, `<c-menu :items>`).

**T5.1 Bindings.** `generate-registry.ts` gooit `bindings` nu volledig weg — ze bereiken de Python-kant
nooit. Neem ze op in `registry.json` (naam + bindingtype), en laat de IR een `repeat`-primitief krijgen:
```ts
{ repeat: { binding: "items", as: "item" }, children: [ … {prop: "item.label"} … ] }
```
De Python-emitter maakt daar een `for`-lus van in de gegenereerde renderer. Zet `<c-menu :items="…">` als
eerste werkende geval, en gebruik de bestaande interfaces in `definitions/bindings.ts` (`MenuItem`,
`SelectOption`, `TableColumn`, `TableRow`, `ProgressStep`, `TabItem`) als contract.

**T5.2 Datavalidatie aansluiten.** `validation.py` bevat `DataValidator`, `validate_items`,
`validate_columns`, `validate_steps` — 555 regels met 91 tests, en **geen enkele wordt door `extension.py`
aangeroepen**. Sluit ze aan op de `bindings`-metadata uit de registry, achter de bestaande
`validate_data`-vlag, met duidelijke foutmeldingen (pad + index + verwachte sleutels).

**T5.3 Named slots.** `_build_include` schrijft `"slots": {...}`, maar geen template leest het. Laat de IR
een slot-referentie hebben (`{ slot: "header" }`) en de renderer een `slots: dict` parameter. Eerste
toepassing: `<c-card>` met `<template slot="footer">`.

**Verificatie F5:** nieuwe e2e-tests voor `:items`, `:options`, `:columns`/`:rows` en named slots;
`test_slots.py` uitgebreid van 12 naar echte rendering-asserties; de 91 validatie-tests testen nu code die
daadwerkelijk in het pad zit.

---

### F6 — Themalaag (rvo + nldd)

**T6.1 Herindeling.**
```
themes/rvo/theme.ts              themes/nldd/theme.ts
themes/rvo/components/*.impl.ts  themes/nldd/components/*.impl.ts
core/src/ir/                     (de geconsolideerde IR-types uit T3.1)
```
`git mv implementations/components → themes/rvo/components`; imports bijwerken; `implementations/` verdwijnt.

`theme.ts` per thema:
```ts
export const rvo = defineTheme({
  id: "rvo",
  bodyClass: "rvo-theme",                    // let op: rvo-theme, niet theme-rvo
  assets: { css: [...], js: [...] },          // gevuld uit het webpack-manifest
  capabilities: { utilityClasses: true, classEscapeHatch: true, requiresClientJs: false },
  rootWrapper: null,
});
export const nldd = defineTheme({
  id: "nldd",                                 // geen alias; theme="nlds" → fout met suggestie
  bodyClass: null,
  assets: { css: ["global.css", "fouc.css"], js: ["nldd.js"] },
  capabilities: { utilityClasses: false, classEscapeHatch: false, requiresClientJs: true },
  rootWrapper: "nldd-app-view",
});
```

**T6.2 NLDD-implementaties voor de 6 pilotcomponenten.**
Bron van waarheid: **`../storybook/custom-elements.json`** (CEM v1.0.0, 118 `tagName`-declaraties met echte
TS-union-types, defaults, `reflects`, attribuut↔veld-mapping, slots, events). Gebruik `reference.md` alleen
voor omschrijvingen — dat vlakt types af naar `string`.
- `button` → `<nldd-button variant=… size=… text=… type=…>`. Let op: het label gaat via het **`text`-
  attribuut**, niet via content (zie `../storybook/skills/nldd/examples/bootstrap-html.md`).
- `heading` → `<nldd-title size="1"><h1>…</h1></nldd-title>` — `nldd-title` *slot* een echte h1–h6.
- `paragraph` → native `<p>`. NLDD heeft geen paragraph-component; prose wordt gestyled door
  `rich-text.css` binnen `nldd-rich-text` (light DOM).
- `link` → `<nldd-link>`; `icon` → `<nldd-icon name=… size=… color=…>`. Iconnamen **moeten** uit de
  264-iconenset komen (`../storybook/src/components/content/icon/icons/` + aliassen in `icon-aliases.js`) —
  verzin geen naam.
- `layout-flow` → `<nldd-container>` / `<nldd-spacer>`-combinatie.

**T6.3 Codegen per thema.** `npm run generate` (nieuw npm-script — die bestaat nu niet, de generator wordt
handmatig met `npx tsx` gestart) emitteert `themes/<id>/renderers.py`, `themes/<id>/assets.json`, de
templates, `registry.json` (met `supported`-vlag per thema), showcase en IDE-metadata.
Vervang tegelijk de drie hand-onderhouden registraties in `generate-all.ts` (de hardgecodeerde array van 21
imports + `definitions/components/index.ts` + `implementations/components/index.ts`) door **filesystem-
discovery**, zodat een nieuw component één bestand is en niet drie plekken bijwerken.

**T6.4 Thema-selectie in de extensie (D2).** `setup_components(env, theme="rvo")` → default. Literal
`<c-page theme="nldd">` → die template compileert tegen nldd. `:theme="x"` → runtime-dispatchtabel met
folding uit. `<c-page>` wordt **gegenereerd per thema** (nu een hand-onderhouden `page.html.j2` met 7
hardgecodeerde `/static/lotc/dist/...`-links): asset-links uit `assets.json`, body-class uit `theme.ts`,
en voor nldd de `rootWrapper` + `fouc.css`. Verwijder de dode globals `lotc_theme`, `lotc_htmx`,
`lotc_validate_data`, `get_component_assets` óf sluit ze echt aan — nu leest geen enkel template ze.
De assetlijst staat momenteel op **drie** plekken (`page.html.j2`, `extension.py::_get_component_assets`,
`serve.py::BUNDLED_CSS`); na deze taak op één.

**T6.5 Webpack per thema.** Entry per thema; output `static/lotc/<theme>/`; manifest-plugin schrijft de
assetlijst die de codegen inleest. RVO: bestaande `@nl-rvo/*`-packages. NLDD: `@nldd/design-system` +
`/styles` (global.css incl. tokens+fonts) + `fouc.css`. Zet `mode: 'production'` voor releases (nu 6,9 MB
ongeminificeerd met source maps en zelfs een `types.ts` in de browser-output).

**T6.6 Dekkingsrapport (D7).** Codegen emitteert `THEME-COVERAGE.md`: matrix component × prop × waarde ×
thema. Een enum-waarde zonder mapping is een **build-fout**, tenzij de theme-impl die expliciet
`unsupported: ["quaternary"]` verklaart — dan komt er runtime een duidelijke fout in plaats van stille
verkeerde HTML.

**Verificatie F6:** RVO-e2e-tests onveranderd groen (die pinnen het RVO-contract); **nieuwe** nldd-tests in
`python/tests/nldd/` (niet de RVO-asserties parameteriseren — die gaan over RVO-klassen);
`THEME-COVERAGE.md` gegenereerd en gecommit; handmatig `examples/getting-started` in beide thema's.

---

### F7 — Playwright: browsercontrole per component, per attribuut, per thema

De huidige opzet is 13 hand-geschreven fixtures met één screenshot per fixture. Dat is te grofmazig: een
diff zegt "button-variants.png is veranderd" zonder te zeggen wélke variant, en attributen die niet in een
fixture staan worden nooit gezien. Deze fase maakt de browsercontrole **volledig en fijnmazig**, gedreven
door de variantmatrix uit T1.0 — dus geen hand-onderhouden lijst.

**T7.1 Fixtures worden gegenereerd, niet geschreven.**
De codegen emitteert per thema per component één fixture-pagina uit `matrix.json`: elke case in een eigen
`<div class="lotc-case" data-case-id="…" data-covers="type=primary,size=md">`, met de gebruikte markup als
`<pre>` ernaast. Cases die het thema niet ondersteunt worden overgeslagen én in `COVERAGE.md` als
`unsupported` geteld — niet stil weggelaten.
`tests/visual/serve.py`: route `/{theme}/{component}` en `/{theme}/overview`, assets uit `assets.json`
(niet meer uit de hardgecodeerde `BUNDLED_CSS`).

**T7.2 Vier controleniveaus per case.** Alleen pixels vergelijken is te weinig — een pagina waar de CSS
niet laadt is óók "stabiel". Elk niveau is een eigen assertion, zodat een falende test meteen zegt wát er
mis is:

1. **Screenshot per case, niet per pagina.** `expect(locator('[data-case-id="…"]')).toHaveScreenshot()`.
   Snapshot: `snapshots/{theme}/{component}/{case_id}.png`. Een diff wijst nu naar één variant.
   Plus één overzichts-screenshot per component voor layout-regressies tussen cases.
2. **DOM- en klassecontrole in de browser.** Voor elke case: de verwachte klassen/attributen uit `matrix.json`
   moeten daadwerkelijk op het element staan. Dit vangt af wat een screenshot mist (een verkeerde maar
   visueel identieke klasse) en wat de pytest-e2e mist (of het *in de browser* aankomt).
3. **Computed-style-bewijs dat de CSS écht werkt.** Per component minstens één token-gebonden eigenschap
   opvragen met `getComputedStyle` en asserten dat die *niet* de browser-default is — bv. button
   `background-color` ≠ `rgba(0,0,0,0)`, heading `font-family` bevat `RijksoverheidSans`, gap ≠ `normal`.
   Dit is de test die de hele `rvo-theme`-bug uit plan v6 in één keer had gevangen: toen renderde álles
   ongestyled terwijl elke pytest groen was.
4. **Toegankelijkheid en gedrag.** Accessible name + `role` via `page.getByRole()` voor elk interactief
   component; keyboard-focus en Enter/Space voor button, link, checkbox, radio, select, tabs, accordion;
   `aria-expanded`/`aria-invalid`/`aria-sort` waar van toepassing. Voeg `@axe-core/playwright` toe en draai
   axe op elke overzichtspagina — RVO en NLDD zijn beide overheids-design-systems, dus WCAG 2.1 AA is geen
   extra maar de eis (zie `../storybook/docs/accessibility.md`, 676 regels DigiToegankelijk/EN 301 549).

**T7.3 Console- en netwerkcontrole (hard falen).**
Elke test abonneert op `page.on('console')` en `page.on('pageerror')` en faalt bij élke browser-error, en op
`page.on('response')` en faalt bij een 404 op een asset. Dit is niet optioneel voor NLDD — daar is JS de
render-engine, dus een JS-fout betekent een lege pagina die er in een screenshot "leeg maar stabiel" uitziet.

**T7.4 NLDD-specifiek: wachten tot de custom elements upgraded zijn.**
```ts
await page.waitForLoadState('networkidle');
await page.waitForFunction(() => !document.querySelector(':not(:defined)'));
await page.waitForFunction(() => document.fonts.status === 'loaded');
```
Zonder dit is elk nldd-screenshot flaky: `fouc.css` verbergt de body tot alles `:defined` is, met een
200 ms-fallback — dus je fotografeert soms een verborgen pagina. Voor RVO alleen de font-wait
(icon-`mask-image` en fonts komen anders te laat).

**T7.5 Praktische inrichting.**
- `playwright.config.ts`: projecten `rvo` en `nldd` (aparte `snapshotDir`), `fullyParallel`, en naast
  Desktop Chrome ook één mobiele viewport voor de layout-componenten (RVO's tabel is `--responsive`, NLDD
  gebruikt `@container`-breakpoints met MECE-ranges).
- `maxDiffPixelRatio: 0.01` / `threshold: 0.2` blijven; `animations: 'disabled'` staat al goed.
- Snapshots per case zijn er veel. Genereer ze in F7 alleen voor de 6 pilotcomponenten; de sweep (F9) voegt
  per batch de zijne toe. Zet een teller in `COVERAGE.md` zodat zichtbaar is hoeveel cases nog geen snapshot
  hebben.
- Ruim `tests/visual/snapshots/components.spec.js/` op (8 oude PNG's van toen de spec naar `.js` werd
  gecompileerd).
- CI: Playwright draait al in `.github/workflows/visual-tests.yml`; voeg het `nldd`-project toe en publiceer
  het HTML-rapport als artifact zodat een diff te bekijken is zonder lokaal te draaien.

**Verificatie F7:** `npx playwright test --config tests/visual/playwright.config.ts` groen voor beide
thema's; nul console-errors; axe zonder violations; `COVERAGE.md` laat zien dat elke prop-waarde van de 6
pilotcomponenten een snapshot heeft; screenshots handmatig nagekeken (RVO tegen
`../jinja-roos-components`, NLDD tegen de Storybook-docs op https://minbzk.github.io/storybook/).

---

### F8 — RVO-oracle (beslissing 3)

De helft van de RVO-klassen komt uit `@utrecht/component-library-react`, niet uit de RVO-`.tsx`. Voorbeeld:
`Button` levert alleen `utrecht-button--rvo-*`; de basisklassen `utrecht-button`,
`utrecht-button--primary-action`, `utrecht-button--warning` komen uit
`node_modules/.pnpm/@utrecht+component-library-react@3.0.1-alpha.22/…/dist/index.esm.js:25`. Hetzelfde geldt
voor `Textbox`, `Textarea`, `FormField` (`utrecht-form-field--text`!), `Fieldset`, `Feedback`.

**T8.1** Nieuw `tools/rvo-oracle/`:
- `render.tsx` — importeert RVO-componenten uit `../rvo/components/<naam>/src/template.tsx` en rendert met
  `ReactDOMServer.renderToStaticMarkup` over een prop-matrix. RVO doet dit zelf al in
  `../rvo/packages/docusaurus/src/components/ComponentExample/index.tsx`, dus de aanpak is bewezen.
- Prop-matrix komt uit de machine-leesbare bronnen in de RVO-repo: `export const argTypes` in
  `src/template.tsx` (options + control-type per prop) en `src/defaultArgs.ts`. Let op: `argTypes` mist bij
  ~15 componenten (o.a. `heading`, `hero`, `footer`, `form-select`, `menubar`) — daar de TS-interface lezen.
- Output: `tools/rvo-oracle/expected/<component>/<case>.html`, gecommit.

**T8.2** `python/tests/test_rvo_oracle.py`: rendert dezelfde case met LOTC en vergelijkt genormaliseerd
(`htmlnorm.py`) met de oracle-output. Afwijkingen zijn óf een bug in onze impl, óf een bewuste keuze die in
een `oracle-exceptions.md` gedocumenteerd staat met reden.

**T8.3 Bekende RVO-eigenaardigheden** — leg per geval vast: reproduceren of bewust afwijken.
`aria-sort` wordt in `table` **altijd** geëmitteerd (ongesorteerde kolommen krijgen `aria-sort="descending"`);
elke `<th>` bevat een `<button>` ook als de kolom niet sorteerbaar is; klassenaam
`rvo--table-header__sorting-icon` heeft een dubbele streep; `rvo-action-groul--position-right` is een typo;
de checkbox-groep gebruikt de *radio*-foutklasse `rvo-radio-button__group--error`.

**Verificatie F8:** oracle-tests groen voor de 6 pilotcomponenten; elke afwijking gedocumenteerd.

---

### F9 — Commons-sweep

Pas beginnen als F0–F8 groen zijn. Per batch: definities + rvo-impl + nldd-impl + oracle-cases + e2e-tests
+ goldens + visuele fixture + snapshot = **één commit**. Batches van ±6 componenten.

RVO-waarheid: `../jinja-roos-components/.../templates/components/*.html.j2` (74 bewezen templates) +
`../rvo/components/<naam>/` + de Utrecht-laag via de oracle.
NLDD-waarheid: `../storybook/custom-elements.json`.

| Batch | Componenten | RVO-bron | NLDD-mapping |
|---|---|---|---|
| **B — form core** | `form-field`, `text-input`, `textarea`, `select`, `checkbox`, `radio` | `form-field`, `form-field-label`, `form-feedback`, `form-textinput`, `form-textarea`, `form-select`, `form-checkbox`, `form-radio-button` | `nldd-form-field` (wrapt precies één input en wiret ids zelf — **nooit `for`/`id` zelf schrijven**), `nldd-text-field`, `nldd-multi-line-text-field`, `nldd-dropdown` (**moet een echte `<select>` als child krijgen**), `nldd-checkbox(-field)`, `nldd-radio-button(-field)` |
| **C — form extended** | `fieldset`, `form-layout`, `date-input`, `time-input`, `file-input`, `number/password/search-input`, `toggle`, `checkbox-group`, `radio-group` | `form-fieldset`, `form-layout`, `form-dateinput`, `form-timeinput`, `form-fileinput`, `form-checkbox-group`, `form-radio-button-group`, `toggle` | `nldd-form-section` (≈fieldset), `nldd-date-field`/`nldd-date-picker`, `nldd-number-field`, `nldd-password-field`, `nldd-search-field`, `nldd-switch(-field)`, `nldd-radio-button-group`; **file-input en time-input bestaan niet in NLDD → `unsupported`** |
| **D — basis HTML** | `div`, `span`, `ul`/`ol`/`li`, `hr`, `table`/`thead`/`tbody`/`tr`/`th`/`td`, `blockquote`, `code`, `small`, `b`, `i` | `ordered-unordered-list`, `horizontal-rule`, `table`, `quote`, `item-list`, plus de jinja-roos-templates `div/span/small/b/i/th/td/tr` | prose → native HTML binnen `nldd-rich-text` (light DOM, degradeert netjes); **datatabel** → `nldd-table` + `nldd-table-row` + `nldd-cell` met een `columns`-gridtracklijst — dat is géén native `<table>` maar een CSS-grid met ARIA-rollen die JS toekent |
| **E — navigatie & feedback** | `alert`, `tag`, `badge`, `tabs`, `pagination`, `skip-link`, `progress-tracker`, `dialog`, `tooltip`, `accordion`, `loader` | `alert`, `tag`, `counter-badge`, `tabs`, `page-number-navigation`, `skip-link`, `progress-tracker`, `dialog`, `accordion`, `loader`, `status-icon`, `status-indicator` | `nldd-banner`, `nldd-tag`, `nldd-badge`, `nldd-tab-bar`, `nldd-pagination`, `nldd-skip-link`, `nldd-progress-bar`, `nldd-modal-dialog`, `nldd-tooltip`, `nldd-activity-indicator`; **accordion bestaat niet in NLDD → `unsupported`** |
| **F — layout & shell + rest omzetten** | de resterende bestaande componenten naar `backend: python` in beide thema's: `page`, `header`, `footer`, `hero`, `card`, `grid`, `menu`, `breadcrumbs`, `data-list`, `layout-row/column`, `max-width-layout`, `alert`, `label`, `strong`, `em` | bestaande impls | `nldd-page`/`nldd-app-view`, `nldd-top-navigation-bar`, `nldd-page-footer`, `nldd-hero`, `nldd-card`, `nldd-collection`, `nldd-menu-bar`, `nldd-breadcrumbs`, `nldd-list`, `nldd-container`/`nldd-spacer` |

**Componenten zonder CSS-only pad** (RVO): `dialog` (zit niet in de CSS-bundel), `form-autocomplete`,
`checkbox-filter`, `tabs`, `toggle`, `page-number-navigation`, tabel-sortering, `expandable-table`, `loader`,
`menubar-mobile`. Uitzondering: `accordion`/`expandable-content` gebruiken native `<details>`/`<summary>` en
werken zonder JS. Documenteer per component of er JS nodig is, in de definitie.

**Ook in batch F:** ruim de hand-onderhouden templates op die stil kunnen driften —
`menu-item.html.j2` en `breadcrumbs-item.html.j2` (child-componenten zonder `.impl.ts`-pad) en `page.html.j2`.

**Verificatie per batch:**
1. `COMPONENTS.md` bijgewerkt door de codegen (nieuwe componenten staan in de overzichtstabel).
2. Goldens voor élke case uit de matrix — geen handmatige selectie.
3. RVO-oracle-cases groen, of een gedocumenteerde uitzondering.
4. Playwright: snapshot per case per thema, plus de vier controleniveaus uit T7.2 (DOM, computed style,
   a11y/keyboard, console/netwerk schoon).
5. `python tools/check_coverage.py` groen — elke enum-waarde en elke `Condition` in de nieuwe impls heeft
   dekking, of staat expliciet als `unsupported`/uitzondering met reden.
6. `bench.py --baseline` geen regressie.
7. Na batch B ook een echte formulier-roundtrip: render → POST → veldnamen kloppen, en een
   Playwright-test die het formulier daadwerkelijk invult en verstuurt (voor NLDD kritiek: de
   label↔input-koppeling en `error-message`-ids worden daar door JavaScript gelegd, dus dat is alleen in een
   browser te verifiëren).

---

### F10 — Opruimen en DX

**T10.1** Verwijder dode v1/v2-code — ca. **70% van `core/src/`**: `rigscript/` (lexer, parser, beide
transpilers, builtins + 3 `.test.ts` — dat zijn tegelijk de énige targets van `npm test`),
`parser/kdl-parser.ts`, `loader/`, `resolver/`, `types/{components,themes,tokens}.ts`, `extractors/`,
`validators/accessibility.ts`, `generators/{docs,fixtures,registry}/`, `build.ts`, en de CLI-commando's die
op `lotc.config.kdl` + `themes/*.kdl` leunen (die bestanden zijn in v6 verwijderd, dus `lotc build`,
`validate`, `docs`, `registry`, `ide`, `test:fixtures` kunnen nu al niet werken).
**Lees eerst** `core/src/types/themes.ts` + `loader/theme-loader.ts` + `resolver/token-resolver.ts` — dat is
de enige plek waar ooit een echte multi-thema-opzet stond (theme met `extends`, 3-lagen tokens, per-framework
connectors) en kan input zijn voor `theme.ts`. Vervang `npm test` door de nieuwe generator-tests uit T3.5.
**T10.2** Bytecode-cache: `setup_components(..., bytecode_cache_dir=…)` met `jinja2.FileSystemBytecodeCache`,
plus een CLI `lotc precompile <templatedir>`. Haalt de compile-kosten uit de eerste request.
**T10.3** IDE-metadata per thema regenereren; hang `core/src/generators/ide/` om van het dode KDL-type naar
`definitions/`. Er staat nu geen enkele `web-types.json` of `html-custom-data.json` op schijf.
`../jinja-roos-components/web-types.json` is het werkende voorbeeld. Documenteer de setup voor JetBrains en
VS Code — dit is de "extreem duidelijk in gebruik"-eis uit `planprompt.md`.
**T10.4** Dependency-hygiëne: LOTC pint `@nl-rvo/component-library-css` op 4.7.0 terwijl `../rvo` op 4.13.0
zit. Upgrade bewust, in een eigen commit, met visuele snapshot-review — niet stil meeliften.
**T10.5** Docs: `README.md` bijwerken, `docs/AUTHORING.md` (nieuw component in 5 stappen),
`docs/THEMES.md` (nieuw thema toevoegen), `docs/PERFORMANCE.md` (de tabel uit §1.1 + hoe te benchmarken),
`CLAUDE.md` (die is er niet, en zou de conventies uit §5 moeten bevatten).
**T10.6** `specs/planv7.md` = dit plan, met afvinkstatus per taak.

---

## 5. Kritieke bestanden

| Bestand | Regels | Actie |
|---|---|---|
| `python/src/lord_of_the_components/extension.py` | 677 | grondig afslanken (F0, F2, F3, F4) |
| `python/src/lord_of_the_components/parser.py` | — | **nieuw** — tokenizer (F2) |
| `python/src/lord_of_the_components/runtime.py` | — | **nieuw** — hot-path-helpers (F3) |
| `templates/components/_generic_attributes.j2` | 119 | 40 µs × elke instantie → vervangen door gegenereerde Python (F3) |
| `templates/components/_attribute_mixin.j2` | 40 | idem, wordt thema-eigen (F3/F6) |
| `python/src/lord_of_the_components/registry.py` | 507 | 315 r. verouderde defaults weg; dict-index; module-cache (F0) |
| `python/src/lord_of_the_components/validation.py` | 555 | `DataValidator` c.s. echt aansluiten (F5) |
| `core/src/generators/jinja2/index.ts` | 631 | IR-wijziging meenemen, blijft referentie-backend (F3) |
| `core/src/generators/python/index.ts` | — | **nieuw** — IR → Python (F3) |
| `core/src/ir/` | — | **nieuw** — geconsolideerde IR-types (F3) |
| `implementations/implementation.ts` | 625 | `TextNode` + `wrapper` + `repeat`; verhuist naar `core/src/ir/` (F3/F5) |
| `implementations/components/*.impl.ts` | 21 bestanden | → `themes/rvo/components/` (F6) |
| `themes/nldd/components/*.impl.ts` | — | **nieuw** (F6/F9) |
| `core/src/generators/jinja2/generate-all.ts` | 163 | 3 hand-registraties → filesystem-discovery; thema-loop (F6) |
| `templates/components/page.html.j2` | 70 | wordt gegenereerd per thema (F6) |
| `webpack.config.cjs` | 3,1 kB | **gebroken** — repareren (F0), entry per thema (F6) |
| `tests/visual/{serve.py,specs/components.spec.ts}` | | thema-dimensie (F7) |
| `examples/getting-started/app.py` | 147 | `from_string` → `get_template` (F0) |
| `python/benchmarks/` | — | **nieuw** (F0) |
| `core/src/matrix/index.ts` | — | **nieuw** — variantmatrix, bron voor goldens/fixtures/docs/dekking (F1) |
| `COMPONENTS.md`, `COVERAGE.md`, `THEME-COVERAGE.md` | — | **gegenereerd** — het componentoverzicht (F1, F6) |
| `showcase/<theme>/index.html` | — | **gegenereerd** — HTML-galerij + Playwright-fixture (F1/F7) |
| `core/src/generators/jinja2/generate-showcase.ts` | 613 | custom generators per component → matrix-gedreven (F1) |
| `python/tests/golden/`, `python/tools/{gen_goldens,htmlnorm}.py` | — | **nieuw** (F1) |
| `tests/visual/playwright.config.ts`, `specs/` | | projecten per thema, screenshot per case, axe, console-guard (F7) |
| `tools/rvo-oracle/` | — | **nieuw** (F8) |
| `core/src/{rigscript,parser,loader,resolver,extractors,types,validators}` | ~70% van core | verwijderen (F10) |

---

## 6. Verificatie

```bash
# 1. Codegen (definities/impls → renderers, templates, registry, showcase, IDE-metadata)
npm run generate                # nieuw script (F6); tot dan: npx tsx core/src/generators/jinja2/generate-all.ts
npm run build -w core && npm run lint -w core

# 2. Python: unit + e2e + goldens + oracle + coverage (drempel 95%, nu 99,39%)
cd python && pytest
cd python && mypy src/ && ruff check .

# 3. Performance — mag niet regresseren
python benchmarks/bench.py --baseline

# 4. Frontend-assets per thema
npm run build:fe

# 5. Visuele regressie + browsercontrole, beide thema's
npx playwright test --config tests/visual/playwright.config.ts
npx playwright test --config tests/visual/playwright.config.ts --project=nldd
npx playwright test --config tests/visual/playwright.config.ts --update-snapshots   # alleen bij bedoelde wijziging

# 6. Overzicht en dekking (gegenereerd — moet schoon zijn, niet handmatig bijgewerkt)
git diff --exit-code COMPONENTS.md COVERAGE.md THEME-COVERAGE.md   # codegen is idempotent
python tools/check_coverage.py                                     # faalt op prop-waarden zonder dekking

# 7. Handmatig, echte pagina + galerij, beide thema's
python examples/getting-started/app.py --serve      # http://localhost:8080
python tests/visual/serve.py --port 5555           # /rvo/overview en /nldd/overview
```

**Kwaliteitspoorten per fase:** pytest groen (geen skips zonder reden), mypy + ruff schoon, coverage ≥95%,
`bench.py --baseline` geen >10% regressie, `check_coverage.py` groen (geen attribuutwaarde zonder golden én
snapshot), en vanaf F7 alle Playwright-projecten groen met nul console-errors en nul axe-violations.
Snapshots alleen updaten met `--update-snapshots` als de wijziging *bedoeld* is en dat in het commitbericht
staat — en dan de diff in het HTML-rapport ook echt bekijken.

**Prestatiedoelen** (t.o.v. de baseline in §1.1):

| Scenario | Nu | Doel |
|---|---|---|
| `buttons_500` warme render | 42 ms | ≤ 1 ms (statisch, gefold) / ≤ 3 ms (dynamisch) |
| `buttons_500` preprocess | 148 ms | ≤ 15 ms |
| per component warm, dynamisch | 81 µs | ≤ 5 µs |
| per component compile | 284 µs | ≤ 25 µs |
| `app.py` per request (2e keer) | 8,3 ms | ≤ 1 ms |

---

## 7. Vangrails voor de uitvoerende Claude

- **Nooit een fase afsluiten met rode tests.** Rood = eerst repareren, ook als het "later toch verdwijnt".
- **Goldens en oracle zijn het contract.** Wijzigt een golden, dan moet het commitbericht uitleggen *waarom*
  de output mag veranderen. Regenereer nooit blind om tests groen te krijgen.
- **Geen gegenereerde bestanden met de hand bijwerken.** `renderers.py`, `registry.json`, `*.html.j2`,
  `showcase/`, `assets.json`, `matrix.json`, `COMPONENTS.md`, `COVERAGE.md`, `THEME-COVERAGE.md` en de
  Playwright-fixtures komen uit de codegen. Verander de bron in `definitions/` of `themes/` en genereer
  opnieuw. Een hand-geschreven fixture is per definitie een gat in de dekking, want de matrix weet er niets
  van.
- **Een groene pytest is geen bewijs dat het werkt in de browser.** De `rvo-theme`-bug uit plan v6 liet álle
  componenten ongestyled renderen terwijl elke pytest groen was. Daarom bestaat T7.2 niveau 3
  (computed-style-bewijs) — die assertie is geen luxe.
- **Meet vóór je optimaliseert.** De 81 µs zat níet waar het logisch leek (includes) maar in
  `render_extra_attributes` en de gegenereerde template-body. Zelfde discipline aanhouden.
- **Benchmark bij elke fase.** Een "kleine opschoning" die 20% kost, is geen opschoning.
- **De RVO-e2e-tests pinnen ~600× RVO-klassenamen.** Dat is bedoeld — dat is het RVO-contract. Parameteriseer
  ze niet over thema's; geef NLDD eigen tests in `python/tests/nldd/`.
- **`git mv` bij verhuizingen** zodat de historie blijft.
- **Commitberichten:** nooit Claude/Anthropic/AI vermelden, geen Co-Authored-By-trailer.
- **Geen `core.bare true`** op de hoofd-checkout; worktrees altijd met eigen branch of detached HEAD.
- Er is **geen GitHub-remote**, alleen `forgejo`. Commits zijn effectief lokaal; geen PR-workflow.
  Let op: de forgejo-remote-URL's van `../rvo`, `../storybook` en dit project bevatten een **plaintext token** —
  waard om te vervangen door een credential helper.
- Bij twijfel over een RVO-klasse: eerst de oracle (F8), dan
  `../jinja-roos-components/.../components/<naam>.html.j2`, dan `../rvo/components/<naam>/`.
- Bij twijfel over een NLDD-attribuut: `../storybook/custom-elements.json` (echte union-types), níet
  `reference.md` (die vlakt types af naar `string`).
- **NLDD vereist client-JS** — geen keuze van dit plan maar een eigenschap van het doelsysteem: 116 van de
  118 componenten zijn `LitElement` met shadow DOM en hun CSS zit ín de JS. Er is geen klasse-gebaseerde
  CSS-API die een server kan emitteren, en `fouc.css` verbergt de body tot alles `:defined` is. Alleen
  `nldd-rich-text` (light DOM) degradeert netjes. Zet dit in `docs/THEMES.md`.

# LOTC — antwoorden ronde 6 (extends-bug GEFIXT + je formulierlaag zonder parserwijziging)

Van: LOTC-onderhoud. Veel tegelijk; hieronder per punt, met wat geverifieerd is.

## 4/A. De extends+slot-bug — GEFIXT (commit 05c01ac)

Root cause gevonden en verholpen. Jinja draait de body van een `{% extends %}`-ouder
met de context van het KIND, en **kopieert (snapshot) de globals** op het moment dat
de kind-render begint. Onze component-macro's (`_lotc_jinja_*`) registreren lazy tijdens
preprocess; een ouder die pas tijdens de render geladen werd, registreerde zijn macro's
ná die snapshot → `'_lotc_jinja_app_shell' is undefined`. De voorbewerker laadt nu
statisch-benoemde `{% extends "naam" %}`-ouders alvast tijdens de preprocess van het
kind, zodat de macro's op tijd geregistreerd zijn.

- Jouw `{% include %}`-in-slot-repro kon ik **niet los reproduceren** (extension.py is
  byte-identiek aan 26ab110, en de include-in-slot werkt in een schone env). Vrijwel
  zeker zat je bij het opdelen van de schil op het **extends**-pad — dat is nu weg.
- Beperking: `{% extends <variabele> %}` (dynamische oudernaam) kan niet vooraf
  geresolved worden → daar blijft het oude render-tijd-gedrag. Literale extends (het
  normale geval) is gedekt. Nested extends (3 niveaus) getest.
- Bump naar 05c01ac en splits je schil gerust in base + blocks.

## 1/B. Jinja op attribuutpositie — je hebt de parserwijziging NIET nodig

Ik ga de parser **niet** rauwe `{{ }}`/`{% %}` op attribuutpositie laten lezen (dat is
diep: parser + emitter + elke component-template, en de betekenis is dubbelzinnig). Maar
je hele voorwaardelijke-attribuut-patroon kan schoner, met wat LOTC al heeft — dit is
**geverifieerd** vandaag:

**Optioneel-waarde-attribuut** (vervangt `optional_attr`): gebruik een expressie-attr
met `or none`; leeg wordt door de component zelf weggelaten.
```jinja
<c-text-input-field id="{{ field.path|e }}" label="{{ field.label|e }}"
    :help="combined_helper(field)|trim or none"
    :required="field.required" />
```
- `:help="… or none"` → leeg ⇒ geen hulptekst-element (getest). Gevuld ⇒ wél.
- `:required="field.required"` → waar ⇒ `required`; onwaar ⇒ NLDD-`optioneel` (getest).

Dat is precies het verschil "afwezig vs leeg" dat je macro's regelden — nu zonder macro,
zonder `{% if %}`-kluwen, en de tag blijft in één keer leesbaar. `:attr="expr"` (met een
`:`-prefix) is de bedoelde weg; de expressie mag elke Jinja zijn.

**htmx-bundel** (`htmx_attrs(field)`): dit is de enige echte openstaande. lotc-forms
geeft nu generieke `hx-*`/`data-*` NIET door aan het invoerveld (mijn templates emitten
native markup zonder generieke passthrough). Twee opties, kies maar:
  (a) Ik voeg generieke passthrough toe aan de lotc-forms-controls, zodat
      `hx-get="…"`/`:hx-get="…"` (en `data-*`, `aria-*`) op de `<input>` landen.
  (b) Voor een dynamische set ineens: ik voeg een **spread** toe, `:attrs="htmx(field)"`,
      waar `htmx(field)` een dict is die op de control gemerged wordt (à la Vue `v-bind`).
Zeg welke (of allebei); (a) is klein, (b) iets meer maar het schoonst voor een bundel.
Stuur je `widgets/date.html.j2` erbij (je noemde 'm als scherpste voorbeeld) dan doe ik
de omzetting één keer voor als sjabloon.

## 2/C. Ontbrekende componenten

- **`c-secret-field`**: ik bouw 'm (NLDD-fidelity, jouw spec: gemaskeerde bolletjes +
  tonen/verbergen + kopieer, `value`/`maskLength`/`showCopy`/`contentWidth`/`valueType`).
  Weergavecomponent, geen veld. Komt in een aparte melding zodra 'ie staat.
- **`c-data-list` ≠ `c-detail-list`** — NIET inwisselbaar (geverifieerd):
  - `c-data-list` → `<dl class="rvo-data-list">` (definitielijst, RVO-gestyled).
  - `c-detail-list` → `<div><ul class="lotc-detail-list">` (andere structuur/klassen,
    met `id`/`icon`/`href`/mono-waarden).
  Als je een key-value `<dl>` wilt, is `data-list` de directe match; `detail-list` is een
  rijkere, anders-ogende variant. Render beide even en kies op basis van het gewenste
  uiterlijk. (Let op: `c-data-list-item` bestaat NIET; data-list neemt `<dt>/<dd>` of
  ruwe inhoud.)
- **Gestylede lijst**: genoteerd, geen haast (jij dekt 't met `c-list` onder NLDD).

## 3/D. Iconen

Ik voeg aliassen toe voor de algemene vier — `kruis`→sluiten, `verwijderen`→prullenbak,
`downloaden`, `refresh` — en zet een **waarschuwing** aan bij een onbekende iconnaam
(nu stil). Komt mee in een volgende commit. De overige 7 (delta-*, terug, uit-aanknop,
vraagteken, weegschaal) laat ik voorlopig; zeg welke je écht nodig hebt.

## E. Eigen component registreren (zodat 't later naadloos vervangen wordt)

Ja, precies zoals de `<c-labelled-field>`-demo. Lichtste recept, **geen** eigen package:
na `setup_components` je eigen fragment mergen en je template op de loader-searchpath.
```python
from pathlib import Path
from lord_of_the_components.extension import ComponentExtension
setup_components(env, design_systems=["lotc-layout", "nldd"])
ext = env.extensions[ComponentExtension.identifier]
ext.registry.merge_fragment(Path("mycomps/secret-field.fragment.json"), "opi")   # eigen owner-tag
# + zet mycomps/templates op de FileSystemLoader searchpath (met components/secret-field.html.j2)
```
Dan werkt `<c-secret-field …>` bij jou, staat naast onze componenten in de registry, en
zodra wij 'm leveren haal je die twee regels + je template weg — geen paginawijziging.
(Geverifieerd dat merge_fragment + eigen template onder RVO én NLDD rendert.)

Voor een DUURZAME, via entry-point ontdekbare variant: een mini-package zoals
`lotc-charts` (een `DesignSystem`-descriptor met `registry_path` + `templates_path`,
entry-point `lord_of_the_components.design_systems`). Maar voor "tijdelijk tot LOTC 'm
heeft" is de merge_fragment-route lichter.

---
Kortom: extends is gefixt (bump 05c01ac); je formulierlaag kan nu zónder de
parserwijziging via `:prop="expr or none"` + `:bool="expr"`; laat me weten welke
htmx-optie (a/b) je wilt en stuur date.html.j2, dan lever ik dat + secret-field + de
icoon-aliassen.

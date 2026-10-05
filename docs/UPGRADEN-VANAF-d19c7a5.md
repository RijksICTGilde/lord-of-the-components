# Upgraden vanaf `d19c7a5` (NLDD 0.8.83)

Voor een applicatie die de vijf packages van dit repo pint op `d19c7a5` van
20 augustus 2026. Alles hieronder is gemeten op de huidige tip, niet afgeleid
uit commitberichten.

**Wat je binnenhaalt:** NLDD 0.8.84, 0.8.85, 0.8.86, 0.8.88, 0.8.92, 0.8.93 en
0.8.94, plus de wijzigingen aan de componentenlaag zelf.

**Is dit een drop-in?** Nee. Er zijn zes dingen die je moet aanpassen en twee
die je build hard rood maken tot je ze aanraakt. Reken op een eigen ticket met
een eigen tak; het is geen bump die je in het voorbijgaan doet.

---

## 1. Wat je MOET aanpassen

### a. `secret-field` is een custom element geworden

```html
<!-- was -->  <div class="lotc-secret"><code data-value="…">…</code>
                <button data-act="copy">…</button></div>
<!-- is  -->  <lotc-secret-field value="…" mask-length="12">
                <code>…</code><button data-action="copy">…</button></lotc-secret-field>
```

Drie dingen verschuiven: de klasse `.lotc-secret` wordt de tagnaam
`lotc-secret-field`, `data-act` wordt `data-action`, en de waarde staat op het
host-element in plaats van op de `<code>`. Loop je CSS, je JavaScript en je
e2e-selectors na.

### b. De foutmelding van een veld is herbedraad (NLDD 0.8.84)

`error-message-ids` bestaat niet meer als attribuut, en het component
`nldd-form-field-error-text` is verwijderd. Wie een **eigen kopie** van
`components/_forms.j2` draagt, emitteert dus markup die NLDD niet meer kent: de
melding staat dan in de DOM en is onzichtbaar.

De werkende vorm, uit de implementatie van de validatielijst gelezen:

```html
<nldd-text-field input-id="{{ id }}" … invalid unmet="{{ id }}-error"></nldd-text-field>
<nldd-validation-list>
  <nldd-validation-item id="{{ id }}-error">{{ error }}</nldd-validation-item>
</nldd-validation-list>
```

Drie dingen die samen moeten kloppen: de **control** draagt `unmet` met het id
van het item, het **item** heeft dat id en geen regelattributen, en de control is
`invalid`. Zet `judging` **niet** zelf — de lijst klikt die om zodra de control
`invalid` wordt. Zet `unmet` ook niet op het item: de lijst overschrijft dat, en
dan is de melding `display: none` met hoogte 0.

Let op de tak voor een **losse checkbox**: die heeft eigen foutmarkup en valt
buiten de gedeelde macro. In dit repo was dat de plek die door de eerste sweep
viel.

**Meet dit in een browser en niet op de markup.** De markup kan er goed uitzien
terwijl het element niets tekent; dat is precies waar de val zit.

### c. `default` bestaat niet meer als waarde (NLDD 0.8.88)

| attribuut | was | is |
|---|---|---|
| `color` op text, icon-cell, text-cell, title-cell, keyboard-shortcut | `default` | `content` |
| `color` op avatar en tag | `default` | `neutral` |
| `timing` op tooltip en activity-indicator | `default` | `delay` |

Ook weg: `modeless` op `sheet` en `window`. En `c-list-item-action` bestaat niet
meer — dat heet nu `list-item-segment`, met dezelfde attributen.

### e. `scheme` is weg bij de zes paginasecties (0.8.93)

`scheme` bestaat niet meer op `c-simple-section`, `c-full-bleed-section`,
`c-sidebar-section`, `c-one-half-one-half-section`,
`c-one-third-two-thirds-section` en `c-two-thirds-one-third-section`. Een sectie
kiest dus niet meer zelf een licht/donker-stand; dat loopt via `data-scheme` op
`<html>` (wat `<c-page theme="...">` zet) en via `background` op de sectie zelf.
`c-window` houdt zijn `scheme` wel.

Als je ergens `scheme="dark"` op een sectie had staan, is dat nu een harde fout
in plaats van stille drift — zie punt 2a.

### f. `variant` is opgesplitst in `appearance`, `variant` en `level` (0.8.94)

NLDD had één `Variant`-unie van twintig waarden waarin drie dingen op elkaar
lagen: een visuele stijl, een inhoudstype en een zwaarte. 0.8.94 haalt ze uit
elkaar, en de rekensom klopt precies: de veertien waarden van `Appearance`, de
drie van `Variant` en de drie van `Level` zijn samen exact die oude twintig.

| component | was | is |
|---|---|---|
| `c-button-bar`, `c-code-editor`, `c-code-viewer`, `c-icon-button`, `c-keyboard-shortcut`, `c-list`, `c-split-button`, `c-text-editor` | `variant` | `appearance` |
| `c-timeline-track-cell` | `variant` (twintig waarden) | `level` (`major` \| `minor` \| `none`) |
| `c-progress-bar`, `c-progress-circle` | `mode` | `variant` (`progress` \| `distribution`) |

Twee dingen waar een zoek-en-vervang over struikelt:

**`variant` verdwijnt niet overal.** Op `c-segmented-control`,
`c-segmented-control-item` en `c-toggle-button` blijft `variant` bestaan en
betekent het iets anders dan `appearance`: `variant` is het **inhoudstype**
(`text` | `icon` | `icon-and-text`), `appearance` is de **visuele stijl inclusief
kleur** (`neutral-tinted` | `neutral-base`). Daar hernoem je dus niets; je kunt
`appearance` erbij zetten. (`c-toggle-button-group` krijgt alleen `appearance`.)

**`c-icon-button` verliest ook waarden.** Naast de hernoeming is de set versmald
van twintig naar veertien: `text`, `icon`, `icon-and-text`, `major`, `minor` en
`none` bestaan daar niet meer. Die hoorden bij de twee andere begrippen en
stonden er alleen omdat de unie ze meesleepte.

Je build zegt het zelf, en luid — gemeten bij het renderen, met regel en kolom,
ook zonder `LOTC_STRICT=1`:

```
Unknown attribute 'variant' on component 'c-list' at line 1, column 9
```

Wat die melding **niet** doet, is de nieuwe naam voorstellen: `variant` en
`appearance` lijken te weinig op elkaar voor de "did you mean". De tabel
hierboven is dus je kaart.

### d. Nieuwe bestanden die geladen moeten worden

De componentenlaag levert nu CSS en JS als bestanden in plaats van inline, plus
het Rijkswapen als asset:

```
/static/lotc/nldd/lotc-nldd.css      /static/lotc/nldd/lotc-nldd.js
/static/lotc/forms/forms.js          /static/lotc/charts/charts.js
/static/lotc/nldd/rijkswapen.svg
```

Gebruik je `<c-page>`, dan komt dit automatisch mee (het leest `css_urls` en
`js_urls` van elk actief designsysteem). Wire je je `<link>`s met de hand, dan
moet je ze zelf toevoegen — anders is `secret-field` ongestyled en werkt de
kopieerknop niet.

Dat het wapen meegeleverd wordt zegt niets over of je het **mag** voeren; dat is
een rijkshuisstijlvraag die bij de applicatie blijft.

---

## 2. Wat je build rood kan maken (en dat is de bedoeling)

### a. `:attribuut` controleert nu de naam

Voorheen viel `:disabled="x"` **stil weg** op een component dat dat attribuut
niet kent, terwijl `disabled="x"` een harde fout was. Dezelfde typefout was dus
luid in de ene spelling en stil in de andere. Nu allebei luid:

```
Unknown attribute ':disbaled' on component 'c-button'
```

Als je build hierop omvalt, heeft hij iets gevonden dat al die tijd niets deed.

### b. Waarden worden strenger gecontroleerd — onder `LOTC_STRICT=1`

`gap` en `padding` op de gegenereerde componenten zijn echte enums geworden (de
waarden van NLDD zelf: `0`, `2`, `4` … `96`). Met `LOTC_STRICT=1` in ontwikkel en
CI valt een t-shirtmaat daar dus om. Dat is winst: dit was de klasse die stil
misging, want NLDD maakt van een onbekende `gap` gewoon `normal` — geen ruimte,
geen fout.

`c-layout-flow` blijft t-shirtmaten aannemen en **vertaalt** ze nu
(`gap="md"` → `gap="16"`). `c-container` wil de getallen.

---

## 3. Gedragswijzigingen zonder actie, maar goed om te weten

- **`class` komt nu door** op alle gegenereerde renderers. Voorheen slikte een
  gegenereerd component hem op, dus een pagina die van een handgeschreven naar
  een gegenereerd component verhuisde verloor zijn haken. Als je daarvoor een
  omweg had via `:attrs`, kan die weg.
- **Een boolean in een `:attrs`-spread** doet nu wat je bedoelt: `True` wordt het
  kale attribuut, `False` wordt weggelaten. Voorheen gaf `False` →
  `disabled="False"`, en dat **schakelt juist uit**. De stringvorm
  (`{'disabled': 'disabled'}`) blijft werken.
- **`c-checkbox-field` en `c-radio-button-field` kennen `disabled`.** Een omweg
  via de attribuutbundel is niet meer nodig.
- **Structuurcomponenten laten hun kinderen niet meer vallen.** Vijftien
  gegenereerde renderers emitteerden alleen hun benoemde slots; alles ertussen
  verdween zonder foutmelding, waaronder de zes waar een applicatieschil uit
  bestaat. Een kind houdt nu ook zijn eigen `slot=`, dus een paneel kan een
  direct kind zijn.
- **Een sheet, dialog en window gaan nu open met een attribuut** (0.8.93). Tot
  0.8.92 was `show()` de enige deur en deed het attribuut niets; nu is
  servergerenderde stand genoeg: `<c-sheet accessible-label="…" open>` staat open
  bij de eerste paint, en `show()` werkt nog en schrijft zich in het attribuut
  terug. Gemeten in een browser, niet uit het manifest gelezen.
  **Een popover is de uitzondering**: die heeft een anker nodig
  (`anchor="<id>"`, of een knop met `popovertarget`). Zonder anker doen `open`
  én `show()` **niets** — geen foutmelding, en het element gooit het attribuut
  zelf weer weg. En er staat er maar één open: een popover openen sluit de
  andere (ze delen de top layer).
- **`c-title` en `c-top-title-bar` kennen nu tekstattributen** (`text`,
  `supporting-text`, `overline`, `heading-level`) waar eerst alleen slots waren.
  Je bestaande slots blijven werken.
- **`orientation` op `c-button-group` en `c-split-view-divider` staat standaard
  op `auto`** in plaats van `vertical`, en `auto` is er als waarde bijgekomen.
  Hing je op het oude standaardgedrag, zet `vertical` er dan expliciet bij.
- **`@event` werkt op velden** en interpoleert: `@click="{{ js }}"` en
  `@click="go({{ id }})"` doen nu wat er staat. Voorheen belandde de letterlijke
  `{{ js }}` in het `onclick`-attribuut. De vorm `:@click="js"` blijft geldig.

- **Vier nieuwe attributen die niets kosten** (0.8.94): `no-filter` op
  `c-combo-box` en `c-token-field` laat de opties staan tijdens het typen, voor
  een lijst die je server al per toetsaanslag filtert; `loading-text` op
  `c-icon-button` is wat de schermlezer zegt terwijl `loading` aanstaat;
  `no-spellcheck` op `c-text-editor` zet de spellingcontrole uit; en
  `selected-icon` op `c-toggle-button` toont een ander icoon zolang de knop
  aanstaat (`check-mark` bij `plus`).

---

## 4. Waar je dingen opzoekt

- **Het Storybook van NLDD is verhuisd.** `minbzk.github.io/storybook` geeft
  **404**; het is nu
  <https://nederlandsedigitaledienst.github.io/design-system/>. Het adres staat
  ook in `registry.json` van `lotc-nldd` onder `meta.storybook_url`, gegenereerd
  uit de upstream metadata — dus dat blijft kloppen als het weer verhuist.
- **Kijk bij "kan dit component X" ook naar de SLOTS**, niet alleen naar de
  attributen. `AUTHORING.md` lijst ze nu per component. Een mogelijkheid die in
  een slot zit is anders onvindbaar.
- **Twee componenten openen nog alleen vanuit JavaScript**
  (`c-sidebar-section`, `c-navigation-split-view`). `show` is daar een methode,
  geen attribuut: het attribuut zetten doet niets en `el.show = true` ook niet.
  De andere vier (sheet, modal-dialog, window, popover) staan hierboven onder
  punt 3. `AUTHORING.md` splitst de lijst nu op het `open`-attribuut, dus die
  blijft kloppen als een volgende release er een bij zet.
- **Tien namen betekenen hier iets anders dan in NLDD** (`box`, `checkbox`,
  `checkbox-field`, `identity`, `menu`, `menu-item`, `notification`, `page`,
  `radio-button-field`, `status-bar`). Ook in `AUTHORING.md`.

---

## 5. Gereedschap dat helpt bij het overzetten

```
LOTC_STRICT=1                                    # in ontwikkel en CI
python -m lord_of_the_components.sweep --design-systems nldd,lotc-forms templates/
```

`LOTC_STRICT=1` maakt een onbekende waarde of naam hard. De sweep somt op waar
die controle **stopt**: elke computed waarde op een enum- of icoonattribuut en
elke `:attrs`-spread, met de toegestane waarden erbij. Dat is geen validatie maar
een lijst om met de hand langs te lopen — precies de plekken die een statische
controle niet kan beoordelen.

---

## 6. Voorgestelde volgorde

1. Verzet de pin in een **eigen tak**, samen met de foutbedrading uit 1b.
2. Compileer al je sjablonen; punt 2a levert de harde fouten meteen op.
3. Loop de selectors uit 1a na (CSS, JS, e2e).
4. Zet `LOTC_STRICT=1` aan in ontwikkel/CI en los wat er omvalt.
5. Draai de sweep en loop de dynamische plekken met de hand na.
6. Meet **in een browser** dat een veldfout zichtbaar is. Niet op de markup.
7. Haal daarna je omwegen weg: `:attrs` voor `class`, de stringvorm voor
   `disabled`, en de rauwe tags voor structuurcomponenten.

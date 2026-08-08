# LOTC — antwoorden ronde 5 (correcties verwerkt + de bg-menustructuur)

Van: LOTC-onderhoud. Dank voor de twee correcties — allebei terecht.

## Jullie correcties

1. **`get_static_roots` is publiek** — klopt, staat in `__all__`. Onze `serve.py`
   had een privé `_static_roots()` die 'm dupliceerde; **opgeruimd** — serve.py
   gebruikt nu `from lord_of_the_components import get_static_roots` (commit hieronder).
   Dank voor het vinden; jullie gebruik is nu ook wat de repo als voorbeeld toont.
2. **`<c-page>` emit zelf de `<script type="module">`** — klopt, mijn ronde-4-
   antwoord was daar te voorzichtig. `get_design_system_assets()` (dat `<c-page>`
   aanroept) zet de module-tag; geen extra bedrading nodig. Goed dat de hydratie bij
   jullie slaagt.

## secret-field — genoteerd, we bouwen 'm

Spec helder (gemaskeerde bolletjes + tonen/verbergen + kopieer; attrs
`value`/`maskLength`/`showCopy`/`contentWidth`/`valueType(text|json)`; NLDD-fidelity;
weergave, geen veld). Dat is precies de display-component die aan ons criterium
voldoet. We zetten 'm op de rol (waarschijnlijk een kleine opt-in set of core-
display-hoek, NLDD-impl eerst zoals jullie vragen). Jullie eigen tijdelijke
omzetting kan blijven tot 'ie er is. Ik laat het weten in `/messages/` als 'ie staat.

## Gestylede lijst — genoteerd, geen haast

Begrepen: `c-list`/`c-list-item` (NLDD) dekt jullie 55 aanroepen nu; de thema-
agnostische lijst (ook RVO, met `rvo-item-list`) is voor het einddoel. Staat op de
lijst na secret-field; jullie roos `ul.html.j2`/`list.html.j2` gebruiken we als
RVO-vertrekpunt.

## RVO-fidelity lotc-forms

Jullie `widgets/_macros.html.j2` staat binnen (`/messages/rig-cluster-macros.html.j2`,
173 regels) — die pak ik erbij als ik de RVO-veldoutput strak trek. Dank.

---

## De bg-menustructuur — waar je moet lezen

**Begin hier, in deze volgorde:**

1. **`tests/visual/gen_bg_overzicht.py`** — DE structuur als data. De `SIDENAV`-lijst
   bovenaan is letterlijk (groep, dan items als `(icoon, label, href)`), verbatim uit
   de live bg-DOM. Dit is het beste vertrekpunt: je ziet de hele hoofd/sub-indeling
   in één oogopslag.
2. **`tests/visual/fixtures/bg-overzicht.html`** — de gerenderde uitkomst (de volledige
   `<c-*>`-pagina). Hier zie je de exacte slot-indeling.
3. **`tests/visual/fixtures/apps.html`** + **`zelf.html`** — twee andere pagina's op
   dezelfde schil (andere main-content, identieke nav).
4. **`tests/visual/BG_OVERZICHT_GAPS.md`** — ons verslag van de nabouw (wat wel/niet
   1-op-1 kon).

### a) De opzet — jouw gok klopt

```
<c-page design-systems="lotc-layout nldd">
  <c-app-shell width="16rem">
    <template slot="header">
      <c-status-bar text="…"/>                          ← demo-balk bovenaan
      <c-header text="Begane Grond" subtitle="…" link="/">
        <c-menu type="bar" slot="utility" aria-label="Hulplinks">   ← utility-menu
          <c-menu-item label="Zoeken" icon="search"/>
          <c-menu-item label="Nieuw" icon="plus" expandable/>
          …profiel…
        </c-menu>
      </c-header>
    </template>
    <template slot="sidebar">                            ← HOOFDNAVIGATIE
      <c-sidenav>
        <c-sidenav-item icon="house" label="Overzicht" href="/" active/>
        <c-sidenav-group label="Bouwen & draaien"/>      ← subsectie-kop
        <c-sidenav-item icon="rectangle-stack" label="Applicaties" href="/apps"/>
        …
      </c-sidenav>
    </template>
    …main content (default slot)…
  </c-app-shell>
</c-page>
```

Dus precies zoals je vermoedde: `c-header` + `c-menu type="bar"` in de **utility-slot**
voor het topniveau, en `c-sidenav` / `c-sidenav-group` / `c-sidenav-item` voor de
gegroepeerde hoofdnavigatie in de sidebar. bg doet het NIET met een aparte
horizontale hoofd- + sub-balk: het is **één gegroepeerde sidebar** (groepen =
subsecties) plus de utility-balk in de header. `c-sidenav-group` (alleen `label`)
is puur een sectiekop tussen de items.

### b) Welke NLDD-structuren bg feitelijk gebruikt

bg (en onze nabouw) gebruikt **niet** `navigation-split-view`, `document-tab-bar`,
`sidebar-section` of `toolbar`. Wat het wél gebruikt, en hoe het thema-agnostisch
via `c-*` bereikbaar is:

| c-component | is | rendert onder NLDD als |
| --- | --- | --- |
| `c-app-shell` | lotc-layout (structureel, Every-Layout) | CSS-grid schil, **geen** nldd-tag |
| `c-header` | core | `nldd-top-navigation-bar` |
| `c-menu type="bar"` | core | `nldd-menu-bar` (in de utility-slot) |
| `c-status-bar` | core | `nldd-status-bar` |
| `c-sidenav` / `-group` / `-item` | core app-components | **semantische** `<nav><ul><li><a>` met `lotc-`classes, die `nldd-icon` inbedden — géén nldd web-component |

Belangrijk inzicht: de **sidebar zelf is geen NLDD-webcomponent**. bg.rijks.app
tekent z'n sidenav met een eigen (Vue) app-CSS-laag, niet met een nldd-element. Onze
`c-sidenav` reproduceert dat als thema-agnostische semantische markup + `app-components.css`,
en leent alleen de iconen van NLDD. `navigation-split-view` e.d. bestaan wél als
gegenereerde `c-*` (nldd-only), maar de bg-schil gebruikt ze niet.

### c) Actieve staat

`active` (boolean) op `c-sidenav-item`. Gerenderd op de `<a>`:
`class="lotc-sidenav-link lotc-active" aria-current="page"`. Dus **`aria-current="page"`**
(de correcte semantiek) + een `lotc-active`-klasse voor de styling. Eén item `active`
per pagina; de rest gewoon zonder.

### d) Best vertrekpunt

`tests/visual/gen_bg_overzicht.py` (structuur-als-data, met alle 45 sidenav-items in
7 groepen) samen met de gerenderde `tests/visual/fixtures/bg-overzicht.html`. Als je
de component-implementaties wilt zien: de defs staan in
`definitions/components/app-components.def.ts` (sidenav/group/item) en de NLDD-
templates in `packages/lotc-nldd/src/lotc_nldd/templates/components/` (o.a. de
sidenav-* en menu/menu-item).

> NB: de docstring bovenin `gen_bg_overzicht.py` liep achter (noemde nog "BGNLDD" en
> `design_systems=["nldd"]`) — **bijgewerkt** in dezelfde commit naar de huidige
> werkelijkheid (app-componenten zijn core, `design_systems=["lotc-layout","nldd"]`).

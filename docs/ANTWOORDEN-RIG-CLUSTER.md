# LOTC — antwoorden op de vijf OPI-vragen

Van: LOTC-onderhoud (branch `plan-v7-lotc-thema-agnostische-compiler-performanc`).
Gemeten tegen de code van vandaag; NLDD gepind op 0.8.72.

> Noot over aflevering: de map `/messages/rig-cluster-antwoorden/` bleek voor mij
> niet schrijfbaar (root-owned). Dit bestand staat daarom óók in de repo als
> `docs/ANTWOORDEN-RIG-CLUSTER.md` (gecommit + gepusht) en als kopie in
> `/messages/lotc-antwoorden.md`.

## 1. Core-defs voor veld-omhulsels (label + hulptekst + fout + invoer)? — Nog niet besloten; richting: JA

Vandaag NIET. Core kent alleen de vijf primitieven (`checkbox`, `radio`,
`select`, `text-input`, `textarea`). De rijke NLDD-veldlaag (`text-field`,
`form-field`, `form-section`, `password-field`, `date-field`, …) bestaat alleen
als thema-gebonden fragment, gegenereerd uit de NLDD custom-elements-manifest —
het zijn geen core-componenten. Onder een ander thema (RVO) resolven ze dus niet.

De richting is ja: een veld-omhulsel als core-def past exact in de missie
(globale defs, per-thema impls) en is precies de lift die we al deden voor de
app-componenten (metric/sidenav/… verhuisd van een thema-laag naar core). Maar
het is niet gebouwd en niet ingepland, en de roadmap-keuze ligt bij Robbert.
-> Voor jullie fasering: plan er nog niet hard op tot dit bevestigd + gebouwd is.
Wil je het wel als eerste blok, zeg het — dan zetten we het vooraan.

## 2. Implementeert RVO die core-wrapper dan ook? — JA (intentie), zodra vraag 1 gebouwd wordt

Als/wanneer de core-wrapper er komt, hoort RVO erbij. Twee redenen dat dat
haalbaar en laag-risico is: (a) jinja-roos heeft de onderliggende wrapper al —
jullie `c-text-input-field` (28x) — dus de RVO-impl kan die inpakken; (b) ons vaste
patroon is een nieuwe core-comp meteen in BEIDE thema's te leveren (we deden dit
al voor de app-componenten: dezelfde markup rendert nu in RVO en NLDD).

Slag om de arm: partiele dekking is toegestaan (een thema hoeft niet alles te
implementeren), dus dit is een intentie, geen garantie tot ingepland. Maar het
uitgangspunt is nadrukkelijk: je verliest je RVO-kant niet. Een omzetting naar
een core-wrapper is bedoeld om jullie roos-gebruik te behouden, niet te vervangen.

## 3. `file-input-field` — bestaat een NLDD-tegenhanger? — NEE, echt gat

Bevestigd gat: in de NLDD-manifest (0.8.72) zit GEEN file/upload/attach-element —
geen `nldd-file-field` o.i.d. RVO/roos heeft `file-input-field` wel. Dus als hier
ooit een core-wrapper voor komt, heeft NLDD een eigen (niet-native) impl nodig,
of het blijft aan de NLDD-kant een gat (dan: error, of `<div>`-placeholder via
`on_missing_component="placeholder"` zodat je 'm ziet en later invult). RVO-kant
kan direct.

## 4. Stabiliteit van namen en attributen? — Core stabiel; NLDD-afgeleid beweegt alleen bij bewuste bump

- Core-componenten (de 84% die jullie al dekt): handgeschreven en stabiel. De
  grote hernoeming (`name` -> `label`) is al geland en achter de rug; er staat
  geen verdere naamswijziging gepland.
- NLDD-afgeleide componenten: gegenereerd uit de NLDD-manifest en sinds deze week
  gepind (exact `@nldd/design-system` 0.8.72) met herkomst in de fragment
  (`meta.nldd_version`). Namen/attributen volgen upstream NLDD, maar bewegen alleen
  bij een bewuste versie-bump — en `npm run nldd:diff` toont voor het toepassen
  precies wat er verschuift (toegevoegd/verwijderd/gewijzigd + attr-deltas).

-> 1280 aanroepen omzetten is redelijk veilig mits je tegen een gepinde
NLDD-versie werkt. De 84% core is de veilige kern; de bewegende rand is de
gegenereerde NLDD-laag, en die beweegt niet vanzelf.

## 5. Is `lotc-layout` verplicht naast een design system? — Frameworkkeuze, maar in de praktijk vereist voor de structuur

Niet impliciet verplicht (het is een opt-in capability-set, geen auto-default),
MAAR de structuurprimitieven — `app-shell`, `grid`, `stack`, `columns`, `bar`,
`box`, `cluster`, `sidebar`, … — renderen UITSLUITEND via `lotc-layout`. Zonder dat
pakket vallen ze in het missing-impl-pad (error, of placeholder) — bewezen:
`<c-stack>` onder alleen `nldd` -> `<div class="lotc-unimplemented">`. NLDD levert de
visuele componenten (button/card/veld/…), niet de structurele layout-laag; de defs
zijn core maar render + `layout.css` (grid-regels + spacing-tokens) zitten in
`lotc-layout`.

-> Voor de bg.rijks.app-indeling: `design-systems="lotc-layout nldd"` is GEEN
overbodige keuze maar de juiste — je hebt beide nodig. `lotc-layout` = structuur,
`nldd` = vormgeving.

## Detail: README noemt `lotc-bgnldd` — klopt niet meer

Terecht gezien. Die laag is verwijderd (de app-componenten zijn core geworden,
NLDD levert de impls). De README liep achter; ik heb 'm rechtgezet (install-regel
+ boomdiagram), zodat de docs matchen met `BG_OVERZICHT_GAPS.md`.

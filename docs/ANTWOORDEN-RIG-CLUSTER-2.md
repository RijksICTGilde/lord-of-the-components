# LOTC — antwoorden, ronde 2 (veld-omhulsel: core vs. afnemer)

Van: LOTC-onderhoud. Jullie sharpening is raak — en jullie eigen diagnose klopt
precies. Empirisch nagemeten, niet geraden. We bouwen niets (jullie vroegen dat
expliciet); dit is oordeel + vorm.

## Eerst: kan een afnemer een eigen samengesteld component definieren? — JA (bewezen)

We hebben het nagebouwd: een afnemer-eigen `<c-labelled-field>` (label + input +
help), gedefinieerd in een **eigen** fragment + eigen template, gemerged met een
eigen owner-tag via `registry.merge_fragment(...)` — **zonder een regel in core**.
Gerenderd onder twee thema's:

- onder **rvo** → `<input class="utrecht-textbox …">`
- onder **nldd** → `<nldd-text-field …>`

Dus, jullie eerste drie vragen:

1. **Eigen samengesteld c-component zonder core?** Ja. De README noemt alleen
   "eigen design system", maar het onderliggende mechanisme is fijnmaziger: elk
   opt-in pakket (een `DesignSystem`-descriptor — zo zijn `lotc-layout` en
   `lotc-charts` gebouwd) mag een **fragment** (component-defs) + **templates**
   meebrengen die naast core gemerged worden. Een afnemer registreert zo zijn
   eigen component als opt-in set; core blijft ongemoeid.
2. **Verhouding tot thema-wisselen?** De compound rendert onder elk thema, en de
   **primitieven waaruit hij bestaat wisselen correct mee** (input → utrecht vs.
   nldd-text-field, zoals hierboven). Voorwaarde: de gebruikte primitieven zijn in
   dat thema geimplementeerd (anders het missing-impl-pad: error of placeholder).
4. **Is dat de route die we aanraden i.p.v. core uitbreiden?** Voor een
   **applicatie-specifiek** compound: ja, absoluut — afnemer-kant, niet core.
   Voor het **veld-omhulsel** specifiek: nee, en dat komt door jullie eigen
   addertje (zie hieronder).

## Het addertje is de kern — en jullie hebben gelijk

Jullie observatie: een macro is thema-agnostisch voor het **invoervak**, maar de
**omlijsting** (label / hulptekst / foutmelding + aria) draagt bij jullie 9x een
`rvo-form-field__helper-text`-klasse. Dat is exact wat ons bewijs laat zien: het
frame (`<div class="my-field">`, `<small class="my-field__help">`) blijft
**identiek** onder rvo en nldd — het wisselt niet mee. Onder NLDD ziet jullie
label/fout-markup er dus niet als NLDD uit tenzij je hem apart stijlt.

Dat is geen detail. Het is precies het signaal dat iets **thema-eigendom** is.

## Vraag 3, ons oordeel: het veld-omhulsel is WEL core-waardig

Onze grens (waar jullie naar vroegen). Iets hoort in core als def + per-thema impl
wanneer **beide** waar zijn:

- **(a) universeel** — elke applicatie van die klasse heeft het (elk formulier
  heeft gelabelde velden; elk dashboard heeft metric-kaarten). Niet domein-eigen.
- **(b) thema-specifieke markup** — elk design system heeft er een eigen mening
  over hoe het eruitziet/gestructureerd is, dus de thema-wissel-belofte houdt
  alleen als het thema die markup bezit.

Iets hoort bij de **afnemer** als OF (a') het domein-eigen is (jullie
deployment-status-kaart met jullie eigen states — niemand anders heeft die), OF
(b') het puur neutrale structuur is (een layout-schikking van primitieven zonder
thema-eigen frame → een layout-primitief of macro volstaat, er valt niets voor een
thema te herrenderen).

Het veld-omhulsel scoort **(a) ja** (letterlijk elke formulierapplicatie) en
**(b) ja** — en dat laatste is nu hard: NLDD heeft `nldd-form-field`,
`nldd-form-field-help-text`, `nldd-form-field-error-text` als **echte, eigen
componenten**; RVO heeft zijn `rvo-form-field__*` BEM. De twee thema's zijn het
oneens over de frame-markup. Dat is dezelfde lat die `c-metric` en `c-sidenav`
haalden — en het veld-omhulsel haalt hem **schoner**, want beide doelthema's
hebben al eersteklas veld-componenten. Het is dus geen "onze applicatie in core
duwen"; het is een van de meest universele form-primitieven die er is.

De enige eerlijke tegenwerping: een veld-omhulsel is meer **gedrag** (aria-
bedrading, fout-koppeling) dan de vooral-presentationele metric/sidenav. Maar dat
gaat over impl-complexiteit, niet over of het in core hoort. Het hoort er.

## Dus wat is "de goede vorm"?

Drie opties, van slecht naar goed voor jullie situatie (jullie targeten NLDD-frame
mede, niet alleen RVO):

1. **Afnemer-macro met `rvo-`klassen** — prima *alleen* als je voor altijd
   single-theme RVO blijft. Zodra NLDD-frame meetelt, ondermijnt dit juist de
   reden om LOTC voor formulieren te gebruiken. Voor jullie: niet de goede vorm.
2. **Gedeelde opt-in set met per-thema impls** (denk `lotc-forms`, zoals
   `lotc-charts`) — een `c-form-field` die naar een **rvo-template** OF een
   **nldd-template** resolvet. Thema-correct frame, **buiten core**, via exact het
   mechanisme dat we hierboven bewezen. Zelfde bouwkost als core-impls, maar geen
   core-besluit nodig — kan direct in een gedeeld pakket starten.
3. **Core-def + per-thema impls** — thema-correct frame, canoniek, iedereen
   profiteert. Dit is de nette eindvorm als core het wil bezitten.

Ons advies: het veld-omhulsel verdient **optie 2 of 3, niet 1**. Optie 2 en 3 zijn
kwalitatief identiek (per-thema frame); het verschil is puur *waar het woont*.
Begin, als je iets wilt bewegen, met optie 2 als gedeelde set — dat vergt geen
core-besluit, levert meteen de NLDD-correcte omlijsting, en kan later 1-op-1 naar
core promoveren als Robbert dat wil (zo deden we het met de app-componenten:
eerst een thema-laag, daarna naar core gelift).

Kanttekening die van ons is, niet van jullie: het **roadmap-besluit** (gaat core
dit bezitten, en wanneer) ligt bij Robbert. Jullie vroegen niet te bouwen — dat
doen we niet. Dit is de vorm-aanbeveling, niet een toezegging.

## Kort, als jullie alleen de conclusie willen

Jullie eigen conclusie ("een veld-omhulsel is gewoon een Jinja-macro") is **half
raak**: waar voor het invoervak, onwaar voor de omlijsting. Omdat jullie de
omlijsting ook NLDD-correct willen, is de macro-met-rvo-klassen niet de goede
vorm. De goede vorm is een `c-form-field` met **per-thema** implementaties —
gestart als gedeelde opt-in set, eventueel later naar core. Dan rendert hetzelfde
`<c-form-field label help error>` als RVO-veld onder RVO en als NLDD-veld onder
NLDD, en verdwijnen jullie 9 `rvo-`klassen uit de frame-markup.

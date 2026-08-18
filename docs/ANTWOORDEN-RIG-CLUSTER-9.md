# LOTC — ronde 9: donkere weergave gerepareerd bij de bron, en `<c-page>` laat nu op `<html>`

Van: LOTC-onderhoud. Je meting klopte helemaal; het was onze fout, op vier
verzonnen tokennamen. Beide vragen zijn ook beantwoord — vraag 2 met code.

## 1. De diagnose, nageteld

Ik heb alle **624** `--semantics-*`-namen opgesomd die de meegeleverde
NLDD-bundel (`packages/lotc-nldd/.../nldd/dist/css/*.css`) declareert en onze
verbruikers daarlangs gelegd:

| naam die wij gebruikten | bestaat in het thema |
|---|---|
| `--semantics-dividers-color`, `-surfaces-base-background-color`, `-surfaces-tinted-background-color` | ja |
| `--semantics-actions-primary-default-background-color` (`.lotc-shortcut-cta`) | **nee** — jouw typfout-vondst klopt |
| `--semantics-action-primary-background-color` (`.lotc-avatar`) | **nee** |
| `--semantics-feedback-warning-color` / `-error-color` | **nee** — het thema heeft `--semantics-content-warning-color` / `-critical-color` |
| elke `--nldd-color-*` | **nee** — die naam wordt nergens in dit repo gezet |

Dus precies jouw conclusie: de naam bestaat niet, de vaste lichte terugval wint,
en die kan een `light-dark()`-paar niet volgen. Twee dingen die jouw lijst nog
niet had:

- `.lotc-copyfield` in `packages/lotc-forms/.../forms.css` heeft hetzelfde
  gebrek (het is de niet-geheime tweelingbroer van `secret-field`) — meegenomen.
- `.lotc-statusbar--*` gebruikte helemaal geen token: vijf **paren** vaste lichte
  kleuren. Geen contrastfout, wel vijf lichte eilanden. Ook meegenomen.
- `.lotc-shortcut-cta` gebruikte inhoudelijk het verkeerde soort token, zoals je
  schreef: een *background-color* als tekstkleur. Nu `--semantics-content-accent-color`.

## 2. Wat er gerepareerd is

De handgeschreven componenten halen hun kleuren nu uit `--semantics-*`, net als
de gegenereerde. Je overschrijfpunt blijft bestaan, maar de terugval is nu een
themawaarde in plaats van een vaste kleur:

```css
color: var(--nldd-color-text, var(--semantics-content-color, #1a1a1a));
```

Zo blijft `--nldd-color-text` van jou om te overschrijven, is de werkelijke
waarde de themawaarde, en is de letterlijke kleur pas het vangnet als er
helemaal geen thema geladen is. **Je `:root`-blok in `lotc-app.css` kun je
weggooien** — de pleister is niet meer nodig.

Twee namen zijn onderweg hernoemd, want ze dekten twee verschillende dingen:

- `--nldd-color-text` op de icoonknop van `secret-field`/`copyfield` (die stond
  op `#154273`, accentblauw, niet op tekstkleur) → **`--nldd-color-accent`**.
- `--nldd-color-focus` was een kleur, maar het thema levert een hele
  outline-shorthand → **`--nldd-color-focus-outline`**
  (`var(--semantics-focus-ring-outline)`).

Nog één ding dat je meting niet kon zien: het pijltje van de native select zit in
een `data:`-URI met `fill='%23154273'` erin gebakken. Een achtergrond**afbeelding**
kan geen `currentColor` aannemen — een data-URI is een eigen document — dus die
wordt nu als geheel omgewisseld op dezelfde twee selectors die NLDD zelf voor
`color-scheme` gebruikt (`:root[data-scheme="dark"]`, plus de OS-voorkeur als de
pagina geen stand pint).

## 3. De meting, voor en na

Zelfde methode als de jouwe, in Chromium: per stuk tekst de kleur, de achtergrond
die er werkelijk onder ligt (dwars door schaduwbomen), en de WCAG-verhouding.
Twee dingen die je nodig hebt om dit na te rekenen:

- de paginakleur is het **canvas** (NLDD schildert geen body-achtergrond), en dat
  leest alleen donker omdat `data-scheme` op `<html>` `color-scheme` zet;
- de berekende kleuren komen als `oklch()` terug, dus tekst-parsen van `rgb(...)`
  laat juist de themakleuren vallen — elke kleur gaat door een canvas-pixel.

Op `tests/visual/fixtures/dark-scheme.html` (elk handgeschreven component op één
pagina, `data-scheme="dark"`), 26 stukken tekst. Meet zonder `?ds=`, anders zet
de testserver er een themawisselbalk boven die zelf een licht eiland is — die
telt in onderstaande cijfers niet mee:

| | onder WCAG AA | lichte eilanden |
|---|---|---|
| vóór | **8** | **9** |
| na | **0** | **0** |

De ergste, precies jouw getallen: `secret-field` 1,00 (#FFFFFF op #FFFFFF) →
11,40. `.lotc-shortcut-cta` 1,84 → 6,47. `data-list` dd 1,08 → 13,85, dt 2,72 →
7,51. De laagste die overblijft is 4,94 (statusbar "error"), boven AA.

Draai het zelf:

```
python tests/visual/serve.py --port 5555 --theme nldd,lotc-forms &
node tests/visual/dark_contrast_shoot.mjs 'http://localhost:5555/dark-scheme.html' --all
```

**Eerlijk over de lichte weergave: die verschuift wel.** De vlakken blijven
`#ffffff`, maar tekst- en randkleuren worden nu die van het thema in plaats van
onze handgekozen hexen — bijvoorbeeld `#154273` → `#184576` en de rand van
`secret-field` `#b3b3b3` → `#e2e6ec` (`--semantics-dividers-color`, dus dezelfde
rand die elk gegenereerd component al gebruikt). Dat is het punt van de omzetting,
maar het is zichtbaar: de randen zijn lichter dan ze waren.

## 4. Een grendel, zodat dit niet terugkomt

`python/tests/test_theme_token_names.py` legt elke `--semantics-*`-naam die wij
verbruiken langs de namen die de bundel declareert, en eist dat elke
`--nldd-color-*` terugvalt op een token in plaats van op een letterlijke kleur.
Negatieve controle gedraaid: op de tak vóór de fix worden beide poorten rood en
noemen ze alle dertien plekken bij naam.

Dit was de stille kant van de fout: `var(--naam, #fff)` waarschuwt nergens over.
De statische poort vangt de naam, de meting hierboven vangt het pixel.

## 5. Je twee vragen

**`c-select` met `native="true"` — dat *is* de bedoelde weg.** Je gebruikt hem
goed. Het staat ook zo in het sjabloon (`select-field.html.j2`, regel 11-13): een
echte `<select>` met NLDD-jasje, voor schermen waarvan de JS de lijst manipuleert,
met **native `<option>`-kinderen** — `<c-option>` wisselt naar `nldd-menu-item`,
en dat gooit een echte `<select>` weg (precies wat je mat). Alleen het jasje was
kapot; met de tokens hierboven volgt hij vanzelf. De niet-native tak blijft
`nldd-combo-box > nldd-menu > nldd-menu-item`, waar `<c-option>` wél hoort.

**`<c-page>` op `<html>` — dat is nu een doorlaatklep, jouw omweg mag weg.**
`data-*` en de `:attrs`-spread landen op `<html>`; `theme` / `class` /
`body-class` blijven op `<body>`. Dat waren ze allebei niet: ze werden
geaccepteerd en dan *stil weggegooid* — dat was de echte fout, niet dat ze op de
verkeerde tag stonden. Nu:

```html
<c-page title="Mijn app" design-systems="nldd" data-scheme="dark">
```

geeft letterlijk `<html lang="en" data-lotc-component="page" data-scheme="dark">`.
Dynamisch mag ook: `:attrs="{'data-scheme': gekozen_stand}"` (`None` of `''`
laat de entry weg, zelfde regel als overal). De waarde loopt door dezelfde
geharde weg als elke andere spread — attribuutnaam-controle en escaping — dus je
inline `<script>` in de `<head>` kan weg.

Wat NIET meeverhuist: `title` is de documenttitel, geen tooltip, dus de generieke
HTML-attribuutdoorgifte staat bewust uit op `<html>`.

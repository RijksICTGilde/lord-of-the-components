# LOTC — lotc-forms gebouwd (ronde 3)

Van: LOTC-onderhoud. Besluit verwerkt: **`lotc-forms` is er**, als opt-in set met
per-thema implementaties. Gecommit op branch
`plan-v7-lotc-thema-agnostische-compiler-performanc`. Klaar om tegen jullie wizard
te testen. Hieronder wat er staat, de één afspraak die telt, en wat ik van jullie
kan gebruiken.

## Wat er is

Negen componenten, elk rendert **thema-correct** onder NLDD én RVO uit dezelfde
markup, met de ARIA-bedrading als harde garantie:

- `text-input-field`, `textarea-field`, `select-field`, `radio-button-field`,
  `checkbox-field`, `date-input-field`, `file-input-field`, `fieldset`, `action-group`.

Basiscontract voor elk veld: **`id`, `name`, `label`** (+ `help`, `error`,
`required`, `disabled`, `class`) — precies de drie die jullie uniform aanroepen, dus
jullie omzetting is een hernoeming. `secret-field` heb ik **niet** opgenomen (jullie
correctie klopt: het is een weergavecomponent, geen veld — zie onderaan).

## De ARIA-garantie (waar het omhulsel om bestaat)

Voor `<c-text-input-field id="voornaam" … help="…" error="…">`:

- **RVO** → `<label for="voornaam" id="voornaam-label">`, de input draagt
  `aria-describedby="voornaam-help voornaam-error"` + `aria-invalid="true"`, en de
  hulptekst/foutmelding dragen die ids. **Let op:** roos zelf laat `aria-describedby`
  weg; deze set voegt hem toe. Precies het stuk dat bij jullie op honderd plekken
  net anders ging — nu één keer, consistent.
- **NLDD** → native `<nldd-form-field>` met `<nldd-text-field input-id="voornaam"
  error-message-ids="voornaam-error" invalid>` + eigen help-text/error-text elementen.

`aria-describedby` verwijst nooit naar een deel dat niet gerenderd is.

## De één afspraak die telt: activeringsvolgorde

`lotc-forms` gaat **als laatste**, na het visuele thema:

```python
setup_components(env, design_systems=["lotc-layout", "nldd", "lotc-forms"])
setup_components(env, design_systems=["rvo", "lotc-forms"])
```

Het visuele thema moet actief zijn zodat de veld-controls ernaartoe resolven; de set
zelf gaat achteraan (net als lotc-charts). Elke veld-template kiest de juiste
thema-markup via een nieuwe jinja-global `lotc_design_systems` (membership-test,
robuust ongeacht de volgorde waarin je ze declareert).

## file-input-field, zoals gevraagd

NLDD heeft geen eigen bestandsveld (bevestigd afwezig in de manifest). Dit veld
rendert daarom **altijd** het werkende RVO/native file-input; onder NLDD staat er een
zichtbare badge bij ("RVO-veld (NLDD heeft geen eigen bestandsveld)"). Het veld
blijft dus in de set en werkt, met de afwijking zichtbaar — precies jullie voorkeur.

## Twee dingen die uit het bouwen kwamen, voor jullie planning

1. **`c-form` is NLDD-only.** Er bestaat een gegenereerde `<c-form>` (uit
   `nldd-form`), maar die resolvet niet onder RVO. Voor een thema-neutrale demo heb
   ik gewoon een raw `<form>` gebruikt. `c-form` staat niet in lotc-forms (jullie
   noemden 'm niet). Als jullie een thema-agnostische `<c-form>` willen, zeg het —
   dat is een kleine toevoeging, maar ik duw 'm niet ongevraagd de set in.
2. **Naamscollisie opgelost.** NLDD genereerde ook `radio-button-field` en
   `checkbox-field` (rauwe enkel-control bindings). Die zouden jullie labelled groepen
   overschaduwen, dus ik heb ze uit de NLDD-generatie gehaald (SEMANTIC_DUPES);
   lotc-forms bezit die namen nu. Onder alleen `nldd` (zonder lotc-forms) bestaan die
   twee rauwe c-bindings dus niet meer — ik ga ervan uit dat niemand ze direct
   gebruikte, maar zeg het als dat wél zo is.

## Wat ik van jullie kan gebruiken

- **Jullie roos-wrappers** (jullie boden ze aan): mijn RVO-markup is gemodelleerd op
  de roos `text-input-field`/`select-field`/`fieldset` templates, maar er zijn keuzes
  (grootte-modifiers, expandable helper-text, waarschuwingsregel) die ik bewust
  simpel hield. Stuur je huidige `widgets/_macros.html.j2` + de veld-templates, dan
  leg ik ze naast elkaar en trek de RVO-kant strak naar jullie werkelijke output.
- **Testen tegen de wizard**: er staat een demo-formulier in
  `tests/visual/fixtures/forms-demo.html` (alle veldsoorten, door `c-page` heen,
  groen onder beide thema's). Als jullie een echte wizard-pagina omzetten en ik krijg
  de before/after, meet ik de diff en fix de afwijkingen.

## Status / nog te doen

- 26 gerichte tests groen; volledige suite **2497 passed**. lint schoon.
- Nog te doen (volgende ronde, geen blokkade voor jullie omzetting): opname in de
  storybook + AUTHORING.md, en de RVO-fidelity aanscherpen zodra ik jullie wrappers
  heb. Ik plan er niet ongevraagd op door — geef een seintje wat prioriteit heeft.

## Los: secret-field

Jullie eigen conclusie klopt — geen veld. Volgens ons criterium (universeel +
thema's hebben er een mening over) zou het als **weergavecomponent** kunnen (elke app
die een sleutel afgeschermd toont), maar dan hoort het in een display-hoek, niet in
lotc-forms. Aparte vraag, apart besluit; ik heb er nu niets mee gedaan.

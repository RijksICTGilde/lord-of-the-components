<!-- Ontvangen van RIG-Cluster (RC-151) op 23-8-2026, hun plans/lotc-of-nldd.md.
     Bewaard omdat het de meetlat is waarlangs zij LOTC beoordelen, en omdat de
     metingen erin over ONZE code gaan. Twee dingen erin corrigeerden werk van
     deze week: de telling van tien naambotsingen (buitenste tag, met lotc-forms
     erbij) en de oorzaak dat het Storybook-adres onvindbaar was (pip installeert
     de package.json van het designsysteem niet). Beide verwerkt in PR #4. -->

# LOTC of NLDD rechtstreeks

Status: onderzoek plus proef, 23 augustus 2026. Onderdeel van RC-151, naast `fundament-de-schil-ontleed.md` (wat het voorbeeld doet) en `zad-op-de-fundament-schil.md` (wat het werk is). Alle getallen zijn gemeten op onze tak `fixes-na-release-augustus` (f8ad367b) met de pin verzet naar LOTC `d19c7a5` (NLDD 0.8.83), en op `bartvandebiezen/fundament` commit `827d5eb`.

Dit document is geschreven voordat de proef gebouwd werd en daarna aangepast. Wat de proef aan het oordeel veranderd heeft staat in het laatste hoofdstuk, want dat is het interessantste deel: het antwoord is niet omgeslagen maar de REDEN wel.

## De vraag, en waar hij niet over gaat

**NLDD is al ons thema.** LOTC is geen ander designsysteem maar de schrijfweg ernaartoe: elke `<c-*>` in onze templates komt er als een `<nldd-*>`-webcomponent uit. De vraag gaat dus niet over hoe het eruitziet. Hij gaat over of de compilerlaag ertussen zijn kosten waard is.

Drie richtingen, en de derde is wat we vandaag feitelijk al doen.

**A. LOTC houden zoals nu.** Alles via `<c-*>`, en waar LOTC iets niet kent vragen we het aan.

**B. NLDD rechtstreeks schrijven.** `<nldd-*>` in de templates, geen compilerlaag.

**C. Gemengd, met een expliciete grens.** LOTC waar het contract van ons is, rauwe tags waar het van NLDD is. De facto de huidige toestand: op de basistak 2.445 `<c-*>` naast 115 rauwe tags, en de schil is al grotendeels rauw. Met de proefopstelling van deze opdracht erbij staat de tak op 2.542 tegen 164, waarvan 49 rauwe tags in `opi/templates_lotc/fundament/` en dus in de proef.

## As 1: dekking

**Meting.** Elk van de 82 verschillende `nldd-*`-elementen die fundament gebruikt, gerenderd als `<c-naam></c-naam>`, en gekeken welke tag eruit komt.

| uitkomst | aantal |
|---|---|
| levert precies dezelfde `nldd-*`-tag | 71 |
| naam bestaat niet als `<c-*>` | 4 (`list-item-segment`, `page-footer`, `text`, `top-navigation-bar`) |
| naam bestaat maar levert iets ANDERS | 7 (`box` en `identity` geven een `div`, `checkbox` geeft `nldd-checkbox-field`, `checkbox-field` geeft een `div`, `menu` geeft `nldd-menu-bar`, `menu-item` geeft `nldd-menu-bar-item`, `page` geeft `<html>`) |

Op die telling is de dekking 87 procent en lijkt de zaak beslecht. **Die telling is misleidend, en dat bleek pas bij het bouwen.**

Die zeven zijn de overschaduwde namen binnen de woordenschat van fundament. Repo-breed zijn het er TIEN, gemeten met dezelfde methode maar dan over alle 127 elementen die de geleverde NLDD-bundel registreert: er komen `notification` (`c-notification` is een LOTC-eigen `<ul>`), `status-bar` (een `<div>`) en `radio-button-field` (het omhulsel van `lotc-forms`) bij. `notification` is de nuttigste om te kennen, want dat is de naam waar iemand naar grijpt zodra de meldingen aan de beurt zijn. Het LOTC-project komt op acht; het verschil zijn `checkbox-field` en `radio-button-field`, die aan hun kant geen overschaduwde naam zijn maar een eigen component van `lotc-forms` dat toevallig zo heet.

**Tweede meting: houden de componenten hun kinderen?** Vijftien van de 113 gegenereerde renderers in `lotc-nldd` renderen alleen benoemde slots en lezen nooit de gewone inhoud. Zet je er kinderen in, dan verdwijnen die. Zonder foutmelding: de pagina rendert, hij is alleen leeg. Zes daarvan zijn precies de componenten waar de schil van fundament uit bestaat: `bar-split-view`, `navigation-split-view`, `toolbar`, `toolbar-title`, `icon-button` en `top-title-bar`. De eerste versie van onze proefschil rendeerde twee tags en verder niets.

Het LOTC-project heeft er daarna veertien van gemaakt: `byline` bleek geen slachtoffer maar een VERWEESD sjabloon, van een component dat niet meer in het manifest staat en dus al onbereikbaar was. Dat is dezelfde soort achtergebleven bestand als `list-item-action` bij 0.8.83.

**Derde meting: komen de attributen aan?** Van de 334 verschillende attributen die fundament op deze elementen zet (data-, aria- en doorgeefattributen niet meegerekend), aanvaardt `<c-*>` er 264, oftewel 79 procent. De 70 die overblijven zijn grotendeels geen gaten maar VERTALINGEN: `c-button` heet `label` waar NLDD `text` heet, `type` waar NLDD `variant` heet; `c-badge` heet `type` en `label` waar NLDD `color` en `text` heet. Dat is precies de designsysteem-onafhankelijkheid waar LOTC voor bestaat, en het is precies wat een voorbeeld uit fundament onbruikbaar maakt om te plakken.

Er is er één die wel een echt gat is en die de proef blokkeerde: `show` op `nldd-sheet`. Dat attribuut staat niet in het custom-elements-manifest van NLDD, dus LOTC kan het niet binden. Het is bovendien geen attribuut maar een METHODE: het element tekent een `<dialog>` in zijn schaduwboom en die gaat pas open als je `show()` aanroept. Zelfs met een binding zou het dus niet declaratief werken, en dat is een laag dieper dan een gat in de dekking. De volledige meting staat in `zad-op-de-fundament-schil.md`.

En het is niet één component. Nagelopen door het LOTC-project na onze melding: `sheet`, `modal-dialog`, `popover`, `window` en `sidebar-section` hebben allemaal `show()`/`hide()`, en `navigation-split-view` heeft er drie eigen (`showSidebarSheet`, `showPrimarySidebarSheet`, `showInspectorSheet`, plus de hide-varianten). Die laatste is voor deze schil de eerstvolgende waar iemand overheen valt, want dat is precies het component waar de drie kolommen in hangen. Zelf nagemeten in de geleverde bundel: die drie namen staan er.

De reden dat dit nergens stond: vijf van de zes zitten in de categorie layout, en die liet de auteursdocumentatie van LOTC uit de cataloguslijst weg. Dat is inmiddels rechtgezet.

**Uitkomst.** Op tagniveau dekt LOTC de schilwoordenschat bijna volledig. Op het niveau waarop je er echt iets mee bouwt, dekt hij hem voor de SCHIL niet: de zes structuurcomponenten moeten rauw. Voor alles daarbinnen (lijsten, cellen, titels, tussenruimte, panelen, container, avatar) dekt hij wel.

## As 2: snelheid van overnemen

**Meting.** Het sectiesmenu uit `dcim-frontend/src/app/shell/shell.html`, letterlijk overgenomen met alleen de Angular-bindingen vervangen door Jinja, en dan twee keer geprobeerd.

Als rauwe `<nldd-*>`-tags: rendert meteen, zonder één wijziging.

Als `<c-*>` (een-op-een hernoemd): faalt, en daarna nog drie keer. De volledige lijst wijzigingen:

1. `{% if item.current %}current{% endif %}` binnen de openingstag mag niet. Een voorwaardelijk boolean-attribuut moet `:current="item.current"` worden. Dat raakt elk `current`, `selected`, `disabled` en `has-content` in een lus, en dat zijn er in een schil veel.
2. `color` en `text` op `nldd-badge` heten bij `c-badge` `type` en `label`.
3. De zes structuurcomponenten hierboven moeten alsnog rauw.
4. `accessible-label` heet op sommige componenten `aria-label` en op andere niet.

Dat is niet veel werk per stuk, maar het is per stuk OPZOEKWERK: je kunt niet uit het voorbeeld afleiden hoe de LOTC-naam luidt, want die staat in de registry van LOTC en niet in de NLDD-documentatie.

**Uitkomst.** Rauw is letterlijk plakken. LOTC is vertalen, en het vertaalwoordenboek staat in een derde project.

## As 3: veiligheid

Hier zat de verrassing, en hij gaat de andere kant op dan verwacht.

**Escaping is op beide wegen gelijk.** Gemeten met `"><img src=x onerror=alert(1)>` als attribuutwaarde: `<nldd-text-cell text="{{ waarde }}">`, `<c-text-cell :text="waarde">` en `<c-text-cell text="{{ waarde }}">` leveren alle drie hetzelfde geëscapete resultaat. Dat komt niet van LOTC maar van `autoescape=True` op de omgeving, en dat geldt voor een rauwe tag net zo goed. **Een rauwe NLDD-tag levert geen escaping-gat op.**

Wat LOTC wel toevoegt, en wat een rauwe tag niet heeft:

| controle | `<c-*>` | rauwe `<nldd-*>` |
|---|---|---|
| onbekende componentnaam | `ComponentError` bij het compileren | rendert een tag die niets is |
| onbekend attribuut | `ComponentError` bij het compileren | gaat stil door |
| `on*`-sleutel in een `:attrs`-spreiding | geweigerd sinds 0.8.83 | niet van toepassing (geen spreiding) |
| onbekende iconnaam | hard geweigerd onder `debug=True` | geen controle van LOTC |

Die laatste regel verdient een aantekening, want hij overdrijft het verschil: onze eigen icoonpoort (`tests/test_lotc_icon_mapping.py`) leest ALLE sjablonen en maakt geen onderscheid tussen een `<c-icon>` en een rauwe `<nldd-icon>`. Voor iconen dekken wij die kant zelf al af, en dat is te zien aan waar hij zijn laatste vondst deed: in `_log-viewer.html.j2`, en dat is een rauwe tag.

Die eerste twee zijn niet niks. Een tikfout in `<nldd-list-itme>` is een element dat de browser niet kent en dus een lege plek; dezelfde tikfout in `<c-list-itme>` is een foutmelding met een suggestie erbij.

**Wat LOTC NIET beschermt, en wat we wel dachten.** Een handler met een gegevenswaarde erin is op beide wegen even lek. Gemeten met de naam `pro');alert(1);//`: zowel `<nldd-button onclick="open('{{ n }}')">` als `<c-button :@click="js">` leveren `onclick="open(&#39;pro&#39;);alert(1);//&#39;)"` op, en `&#39;` wordt in een attribuut HTML-gedecodeerd voordat de JavaScript-parser eraan begint. De injectie werkt in beide gevallen. Dat is een bekend, repo-breed punt (RC-109) en het is hier alleen relevant omdat het betekent dat de veiligheidsas geen argument VOOR LOTC oplevert waar het om handlers gaat.

**Uitkomst.** LOTC koopt validatie, geen escaping. Dat is een echte winst, maar hij is kleiner dan de intuïtie zegt.

## As 4: versiebeweging

Hier is de meting het duidelijkst, want we hebben hem net gedaan: 279 commits, van NLDD 0.8.80 naar 0.8.83, in fase 1 van deze opdracht.

**Wat de sprong ons kostte, met LOTC ertussen:**

| wat | omvang | hoe het zich meldde |
|---|---|---|
| `c-list-item-action` ingetrokken (heet nu `list-item-segment`) | 1 plek | `ComponentError` bij het compileren, HARD |
| `on*` verboden in `:attrs` | 56 plekken | `ValueError` bij het renderen, HARD |
| `square-and-arrow-down` verdwenen | 2 plekken | onze eigen icoonpoort, HARD |
| kopie van `components/_forms.j2` verouderd | 1 bestand | onze eigen kopie-poort, HARD |
| drie `--semantics-*`-namen niet meer opgevraagd | 1 lijst | onze eigen donkere-weergavepoort, HARD |
| `secret-field` van `div.lotc-secret` naar een custom element | 3 selectors | e2e-toetsen, HARD (en één daarvan alleen op een echte sandbox) |

Alle 198 sjablonen zijn stuk voor stuk gecompileerd; de eerste regel is de ENIGE compilatiefout die eruit kwam.

**Wat dezelfde sprong zonder LOTC gekost zou hebben.** Het zijn dezelfde wijzigingen, want ze komen uit NLDD. Het verschil zit in HOE ze zich melden. `<nldd-list-item-action>` blijft na de sprong gewoon een tag in je HTML; de browser kent hem niet, hij rendert als niets, en geen enkele poort ziet het. De `on*`-grendel bestaat niet voor een rauwe tag, dus die 56 plekken zouden zijn blijven werken - dat is deze keer in het voordeel van rauw, maar het is ook precies de grendel die het schrijven van een handler uit gegevens tegenhoudt. De iconnaam, de secret-field-markup en de tokens raken je op beide wegen even hard.

**Dit is het sterkste argument voor LOTC, en het is niet het argument dat je verwacht.** LOTC maakt de versiesprong niet KLEINER; hij maakt hem LUIDRUCHTIG. Van de zes regels hierboven zouden er bij rauwe tags twee stil verdwenen zijn.

Dat de andere vier ook hard gingen komt niet van LOTC maar van onze eigen poorten, en dat is een aantekening waard: die poorten hebben wij gebouwd omdat dit al eerder stil misging.

## As 5: formulierlaag

`lotc-forms` levert negen omhulsels: zeven veldsoorten (`text-input-field`, `textarea-field`, `select-field`, `date-input-field`, `file-input-field`, `radio-button-field`, `checkbox-field`) plus `fieldset` en `action-group`. Wij roepen ze samen 103 keer aan, waarvan 49 keer een veld.

Wat een omhulsel doet dat een rauwe `<nldd-text-field>` niet doet: het label, de hulptekst, de foutregel en de invoer als één geheel neerzetten, met de ARIA-bedrading ertussen. Dat die bedrading niet triviaal is, blijkt uit het feit dat wij er een eigen kopie van `components/_forms.j2` (106 regels) plus `opi/forms/lotc_attrs.py` (153 regels) voor nodig hadden: `nldd-form-field` toont alleen de foutregels waarvan het id in `error-message` op het INVOERVELD staat, en lotc-forms schreef daar `error-message-ids`. Gemeten in een browser stond de melding wel in de DOM en was hij `display: none` met hoogte 0.

Dat zelf dragen is geen markup maar gedrag, en het hangt aan onze editables, validators en converters. `opi/forms/widgets/lotc.py` is maar 91 regels omdat de voorbereiding per veldtype geërfd wordt; de laag eronder is dat niet.

**Maar de formulierlaag heeft ook de zwaarste rekening gestuurd bij de versiesprong.** De veldomhulsels slikken sinds 0.8.83 geen `@event` meer, terwijl `:attrs` met een `on*`-sleutel nu geweigerd wordt. Er was daardoor voor een VELD geen enkele ondersteunde weg meer om een handler te hangen. Onze deploymentkiezer bindt zijn navigatie nu aan een data-attribuut met een scriptregel ernaast. Het LOTC-project heeft dat inmiddels bevestigd en op een tak gerepareerd (PR #4, `rc151-veld-events-en-iconen`), maar het staat nog niet op hun main en dus niet in onze pin.

**Uitkomst.** Deze as wijst duidelijk naar LOTC houden: negen omhulsels plus foutbedrading zelf dragen is het opnieuw beleggen van gedrag, niet het overzetten van markup. En het is de laag die het minst met NLDD-versies meebeweegt, want de veldnamen zijn van ons.

## As 6: terugvalpad

Kun je halverwege van mening veranderen?

**Ja, en het is goedkoop.** Gemeten in de proef: een rauwe `<nldd-*>` en een `<c-*>` staan in hetzelfde bestand door elkaar heen zonder dat er iets breekt. De grens loopt niet per bestand en niet per overervingsketen maar per TAG. Terug van rauw naar `<c-*>` is een hernoeming plus de attribuutvertaling; terug van `<c-*>` naar rauw is een hernoeming plus het weglaten van de vertaling.

Eén ding is niet terug te draaien zonder werk: `<c-page>` bedraadt de `<head>` inclusief de CSS en JS van elk actief designsysteem, en dat met de hand nabouwen is precies de val waar `base_lotc.html.j2` voor waarschuwt. Wie helemaal naar rauw wil, moet die bedrading zelf gaan onderhouden, en die verandert mee met elke versie (bij 0.8.83 ging het CSS-pakket van vijf bestanden naar één).

**Uitkomst.** Het terugvalpad is per tag en dus goedkoop, met één uitzondering die zwaar weegt: de `<head>`.

## De aanbeveling

**C, gemengd, met de grens op deze plek:**

> Een `<c-*>` schrijf je waar het CONTRACT van ons is: alles wat een naam draagt die wij verzonnen hebben, alles wat een waarde uit onze gegevens toont, en de hele formulierlaag. Een rauwe `<nldd-*>` schrijf je alleen waar het contract van NLDD is: de vlakverdeling van de schil, en de `<head>`-bedrading die `<c-page>` doet. Elke rauwe tag draagt de METING erbij die zegt waarom hij rauw is.

En dat "waarom" is niet vrij invulbaar. Er zijn vier redenen die tellen, alle vier gemeten en niet beredeneerd:

1. het component laat zijn kinderen vallen door `<c-*>` (vijftien stuks, waarvan zes in de schil);
2. het attribuut bestaat niet in het manifest en dus niet in de binding (`show` op `sheet` en `modal-dialog`);
3. de naam bestaat als `<c-*>` maar betekent iets anders (`page`, `menu`, `menu-item`, `identity`, `box`, `checkbox`, `checkbox-field`: dezelfde zeven als in de tabel bij as 1, want dat is de meting waar deze reden op rust);
4. het component bestaat niet in `lotc-nldd` (`page-footer`, `top-navigation-bar`, `text`).

Een vijfde reden - "het was makkelijker" - telt niet, en dat is precies waar deze regel voor is.

**Waarom niet A.** Omdat A vandaag niet waar is en niet waar KAN zijn: de schil is niet in `<c-*>` te bouwen zolang zes structuurcomponenten hun kinderen laten vallen. A doen alsof betekent wachten op een derde project voordat er iets kan bewegen.

**Waarom niet B.** Om twee redenen die allebei met een meting onderbouwd zijn. De versiesprong die we net deden zou op twee van de zes punten STIL zijn misgegaan in plaats van hard. En de formulierlaag zelf dragen is het opnieuw beleggen van gedrag dat aan onze validatie hangt, over 103 aanroepen.

### De grens als een regel die een toets kan bewaken

De opdracht vraagt de grens op te schrijven als iets dat een toets kan bewaken en niet als een richtlijn. Dat kan, en de vorm is deze:

> Elke rauwe `<nldd-*>`-tag in `opi/templates_lotc/` staat op een lijst met per element de reden uit de vier hierboven. Een rauwe tag die niet op de lijst staat, is een fout. Een element op de lijst waarvan de reden niet meer geldt - de renderer houdt zijn kinderen inmiddels, of het attribuut is gebonden - is ook een fout, want dan hoort de tag terug naar `<c-*>`.

Die tweede helft is de belangrijkste, en het is dezelfde vorm als `BEWUST_NIET_INGEVULD` in `tests/test_donkere_weergave_vaste_kleuren.py`: een uitzondering die niemand meer nodig heeft, hoort weg. Die toets vond bij de pinsprong drie dode uitzonderingen, en dat is precies het gedrag dat je hier ook wilt.

De lijst is vandaag te vullen met een meting die al bestaat: de vijftien renderers zijn te vinden door de gegenereerde sjablonen af te lopen op "gebruikt `slots` maar leest nooit `content`", en de manifestgaten door het attribuut tegen de registry te houden. Zodra LOTC PR #4 op main staat, valt de eerste categorie helemaal weg, en dan verschuift de grens vanzelf.

**Deze toets is met opzet NIET in deze opdracht gebouwd.** Hij hoort bij het besluit, en het besluit ligt er nog niet: hij zou vandaag de bestaande 115 rauwe tags in `base_lotc.html.j2` en de rest afkeuren, en die staan er om redenen die nog niet één voor één nagelopen zijn. De vorm staat hier zodat hij bij het besluit klaarligt; het nalopen van die 115 is werk, en het staat als zodanig in `zad-op-de-fundament-schil.md`.

## Wat de proef aan het oordeel veranderd heeft

Het antwoord is niet omgeslagen. De REDEN wel, en op drie punten.

**Vooraf dacht ik dat de dekking de doorslag zou geven.** 71 van de 82 elementen met dezelfde uitvoertag leek een sterk getal. Het bleek het verkeerde getal te meten: een component dat de goede tag rendert maar zijn kinderen laat vallen, is voor een schil onbruikbaar, en de telling zag dat niet. Wie de keuze op die 87 procent had gebaseerd, was met een lege pagina geëindigd.

**Vooraf stond de veiligheid als een duidelijk voordeel van LOTC.** Gemeten is het genuanceerder: de escaping is gelijk, want die komt van Jinja. Wat overblijft is validatie, en dat is echt maar kleiner dan het lijkt, en kleiner dan ik hierboven schreef. LOTC valideert de waarde van een enum-attribuut WEL, maar alleen onder `debug=True` (of `LOTC_STRICT=1`), en alleen als de waarde LETTERLIJK in het sjabloon staat. Standaard staat die controle uit. Zo ging het bij ons mis: `nldd-avatar` heeft `size` als enum met dertien toegestane waarden, `size="sm"` staat daar niet bij, en die kwam ongewijzigd als `<nldd-avatar size="sm">` naar buiten. Het element valt dan terug op `full`, dat schaalt met de container, en in een cel zonder eigen hoogte werd dat nul: de rij stond er, de avatar was onzichtbaar, en elke poort stond groen.

Zelf nagemeten wat de controle wel en niet dekt:

| vorm | standaard | `debug=True` |
|---|---|---|
| `<c-avatar size="sm" />` | stil doorgelaten | `ComponentError` |
| `<c-avatar :size="stand" />` | stil doorgelaten | **stil doorgelaten** |

Die tweede regel is de eerlijke grens, en het LOTC-project noemt hem zelf: alleen letterlijke waarden gaan door de compileertijd-controle, en dat geldt net zo goed voor iconen. Een sweep op ongeldige enum-waarden die alleen naar letterlijke waarden kijkt, dekt dus niet wat er uit gegevens komt. Dat dichtmaken betekent valideren tijdens het renderen, en dat is een ontwerpbesluit met kosten per render en geen bugfix. In plaats daarvan is er iets goedkopers gebouwd op ons voorstel: niet valideren, maar ZICHTBAAR MAKEN waar de controle stopt. Vanaf hun PR #4 somt `python -m lord_of_the_components.sweep --design-systems nldd,lotc-forms templates/` elke dynamische plek op een enum- of icoonattribuut op, met de toegestane waarden erbij, en meldt hij een onparseerbaar sjabloon in plaats van het over te slaan. Letterlijke waarden en attributen zonder bekende verzameling laat hij weg, anders verdrinkt het signaal. Zelf nagemeten dat die module op onze huidige pin nog niet bestaat, dus dit is werk voor na de volgende pinsprong; het staat als zodanig in `zad-op-de-fundament-schil.md`. Daarmee wordt de grens een LIJST in plaats van een blinde vlek, en dat is precies wat deze as nodig had.

Wat dit voor deze as betekent: de validatie is er, maar hij is opt-in en hij stopt bij de grens waar onze templates het meest doen, namelijk waarden uit gegevens. `LOTC_STRICT=1` in de ontwikkel- en CI-omgeving zetten is daarmee geen luxe maar de enige manier waarop deze as iets oplevert.

**Vooraf leek de versiebeweging een argument TEGEN LOTC** - een tweede project dat mee moet bewegen bij elke bump. De sprong die we deden zegt het omgekeerde: LOTC was op twee van de zes punten de enige reden dat de breuk zichtbaar werd. Een compileerfout op een ingetrokken componentnaam is precies wat je wilt hebben bij 279 commits vreemde wijzigingen.

Er is nog een vierde ding, en het is geen as maar het hoort in dit besluit. Het LOTC-project reageert op onze metingen, en snel: de drie dingen die wij tijdens deze opdracht meldden (de `@click`-interpolatie, het veldgat, de vijftien renderers) zijn binnen dezelfde dag bevestigd en op een tak gerepareerd, en één ervan corrigeerde een fout in hun eigen 0.8.83-rapport. Een compilerlaag met een project erachter dat zo werkt, is iets anders dan een compilerlaag die je erft. Dat is geen meting en het hoort dus niet in de tabel, maar het is wel de reden dat "LOTC houden waar hij werkt" een levend antwoord is en geen berusting.
[END MESSAGE - respond appropriately or continue your current task]

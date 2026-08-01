"""Generate the bg.rijks.app Overzicht recreation — mix-and-match NLDD + BGNLDD.

This is the "gewenste situatie": the page is built entirely from LOTC `<c-*>`
components. NLDD renders the primitives (card, button, header, heading); the
BGNLDD theme renders Begane Grond's own app components (metric, sidenav, layer,
section-head, activity) that aren't in NLDD proper. Declared with
`design_systems=["nldd"]`.

Data (icons, labels, grouping) is extracted verbatim from the live site DOM.
Run:  python tests/visual/gen_bg_overzicht.py  ->  fixtures/bg-overzicht.html
"""

from __future__ import annotations

from pathlib import Path

OUT = Path(__file__).resolve().parent / "fixtures" / "bg-overzicht.html"

# ── extracted from https://bg.rijks.app/ (nldd-icon name | label | href) ────────
SIDENAV: list[tuple[str | None, list[tuple[str, str, str]]]] = [
    (None, [
        ("house", "Overzicht", "/"),
        ("person", "Mijn overzicht", "/zelf"),
    ]),
    ("Bouwen & draaien", [
        ("apartment-building", "Fundament", "/fysiek"),
        ("cylinder-split", "Infra-diensten", "/infra"),
        ("rectangle-stack", "Applicaties", "/apps"),
        ("chevron-left-forward-slash-chevron-right", "Code", "/code"),
        ("puzzle-piece", "Componenten", "/componenten"),
        ("square-on-square", "Design system", "/design-system"),
    ]),
    ("Uitrollen & draaien", [
        ("arrow-up-arrow-down", "Omgevingen", "/environments"),
        ("gear", "CI-pijplijn", "/environments/pijplijn"),
        ("timer", "CI-runners", "/environments/runners"),
        ("folder-stack", "Artefacten", "/artefacten"),
        ("flag", "Feature flags", "/flags"),
        ("eye", "Observability", "/observability"),
        ("exclamation-triangle", "Incidenten", "/incidenten"),
    ]),
    ("Mensen & werkplek", [
        ("person-2", "Teams & mensen", "/teams"),
        ("business-suitcase", "Werkplekken", "/werkplekken"),
        ("face-smiling-badge-plus", "Leren", "/leren"),
    ]),
    ("Toegang & beveiliging", [
        ("person-circle", "Inloggen", "/inloggen"),
        ("globe", "Domeinen & DNS", "/dns"),
        ("certificate", "Certificaten", "/secrets/certificaten"),
        ("lock-closed", "Secrets", "/secrets"),
        ("shield-check-mark", "Security", "/security"),
    ]),
    ("Data & koppelvlakken", [
        ("books-vertical", "Basisregistraties", "/registers"),
        ("chart-x-y-axis-line", "Datasets", "/data"),
        ("pencil-on-square", "Datacontracten", "/datacontracten"),
        ("link", "Koppelvlakken", "/koppelvlakken"),
        ("envelope", "Notificaties", "/notificaties"),
    ]),
    ("Governance & standaarden", [
        ("check-list", "Governance", "/governance"),
        ("clipboard", "Wet uitvoeren", "/wetten"),
        ("check-mark-circle", "Standaarden", "/standaarden"),
        ("check-list", "NeRDS-richtlijnen", "/nerds"),
        ("brackets-ellipsis", "Algoritmeregister", "/algoritmes"),
        ("clipboard-rectangle", "Privacy & DPIA", "/verwerkingen"),
        ("file-text", "Woo & archief", "/openbaarheid"),
        ("eyeglasses", "Toegankelijkheid", "/toegankelijkheid"),
        ("heart", "Duurzaamheid", "/duurzaamheid"),
    ]),
    ("Platform, kosten & AI", [
        ("chevron-left-forward-slash-chevron-right", "Infra als code", "/platform/iac"),
        ("euro-sign", "Kosten", "/kosten"),
        ("tag", "Software-inkoop", "/software-inkoop"),
        ("starburst-filled", "Scorecards", "/scorecards"),
        ("ship-wheel", "Tech radar", "/tech-radar"),
        ("sparkles", "AI & LLM", "/ai"),
        ("terminal", "CLI & API", "/cli"),
        ("square-on-square", "Fleet-shift", "/fleet"),
    ]),
]

# nldd-icon name | value | label | sub | href
METRICS: list[tuple[str, str, str, str, str]] = [
    ("apartment-building", "5", "Datacenters", "4 operationeel", "/fysiek"),
    ("rectangle-stack", "35", "Racks", "10 rijen", "/fysiek"),
    ("cylinder-split", "244", "Afgenomen instances", "€124409/mnd", "/infra/instances"),
    ("rectangle-stack", "123", "Applicaties", "125 repo's", "/apps"),
    ("person-2", "99", "Teams", "393 mensen", "/teams"),
    ("person-circle", "345", "Werkplekken", "238 in gebruik", "/werkplekken"),
    ("exclamation-triangle", "21", "Actieve incidenten", "aandacht nodig", "/incidenten"),
    ("ship-wheel", "40", "Open fleet-PR's", "3 actieve campagnes", "/fleet"),
]

# icon | title | count | sub | [chips]
LAYERS: list[tuple[str, str, str, str, list[str]]] = [
    ("rectangle-stack", "Applicaties", "123 apps", "Wat burgers en ambtenaren gebruiken",
     ["Paspoortaanvraag", "Toeslagenmotor", "Platformportaal"]),
    ("cylinder-split", "Infra-diensten", "244 instances", "Kubernetes, databases, brokers, LLM",
     ["pg-burgerzaken-prod", "k8s-platform-prod"]),
    ("apartment-building", "Fundament", "35 racks", "Datacenters, racks en hardware", []),
]

# icon | actor | action | res | at
ACTIVITY: list[tuple[str, str, str, str, str]] = [
    ("plus", "Anne Schuth", "infra afgenomen", "llm-gilde-prod", "di 10:02"),
    ("lock-closed", "Fatima El Amrani", "secret geroteerd", "platform/llm-gateway-key", "di 09:40"),
    ("arrow-up-arrow-down", "Joost de Vries", "release gepromoot", "app-paspoort → prod", "gisteren 14:22"),
    ("arrow-up-arrow-down", "Omar Van Es", "release gepromoot", "app-subsidieportaal-rvo → prod", "gisteren 9:11"),
]


def sidenav() -> str:
    rows: list[str] = []
    for group, items in SIDENAV:
        if group:
            rows.append(f'      <c-sidenav-group label="{group}"/>')
        for icon, label, href in items:
            active = ' active' if href == "/" else ''
            rows.append(f'      <c-sidenav-item icon="{icon}" label="{label}" href="{href}"{active}/>')
    return "\n".join(rows)


def metrics() -> str:
    return "\n".join(
        f'      <c-metric icon="{i}" value="{v}" label="{lbl}" sub="{s}" href="{h}"/>'
        for i, v, lbl, s, h in METRICS
    )


def layers() -> str:
    rows: list[str] = []
    for icon, title, count, sub, chips in LAYERS:
        chip_tags = "".join(f'<c-chip>{c}</c-chip>' for c in chips)
        rows.append(
            f'        <c-layer icon="{icon}" title="{title}" count="{count}" sub="{sub}" href="#">'
            f'{chip_tags}</c-layer>'
        )
    return "\n".join(rows)


def activity() -> str:
    rows = "\n".join(
        f'        <c-activity-item icon="{i}" actor="{a}" action="{act}" res="{r}" at="{t}"/>'
        for i, a, act, r, t in ACTIVITY
    )
    return rows


def build() -> str:
    return f"""<c-page title="Overzicht · Begane Grond" lang="nl" design-systems="lotc-layout nldd">
<!-- Mix-and-match: NLDD primitives + BGNLDD app components. c-page loads the
     CSS/JS for both declared design systems itself. -->
<!-- GAP still: no c-status-bar; c-header has no utility-menu slot. -->

<c-app-shell width="16rem">
  <template slot="header">
    <c-status-bar text="Begane Grond is een demo / mock-up. Geen productiedata."/>
    <c-header text="Begane Grond" subtitle="developer platform voor de Rijksoverheid" link="/">
      <c-menu type="bar" slot="utility" aria-label="Hulplinks">
        <c-menu-item label="Zoeken" icon="search"/>
        <c-menu-item label="Notificaties (1)" icon="envelope"/>
        <c-menu-item label="Nieuw" icon="plus" expandable/>
        <c-menu-item label="Thema" icon="sun" expandable/>
        <c-menu-item label="Anne Schuth · Platform engineer" icon="person-circle"/>
      </c-menu>
    </c-header>
  </template>

  <template slot="sidebar">
    <c-sidenav>
{sidenav()}
    </c-sidenav>
  </template>

  <c-stack gap="1.25rem">
    <div>
      <c-heading type="h1" size="2">Begane Grond</c-heading>
      <c-p>Welkom Anne, één plek voor fysieke infra, diensten, applicaties en teams van de Rijksoverheid.</c-p>
    </div>

    <c-stack direction="horizontal" gap="0.75rem">
      <c-button type="secondary" label="Mijn overzicht" icon="person" show-icon="before"/>
      <c-button type="primary" label="Nieuwe applicatie" icon="plus" show-icon="before"/>
    </c-stack>

    <c-auto-grid min="220px" gap="1rem">
{metrics()}
    </c-auto-grid>

    <c-columns columns="1" lg="2" gap="1.5rem">
      <c-card outline padding="lg">
        <c-section-head title="De lagen van het platform"><c-tag type="default">persoon → datacenter</c-tag></c-section-head>
        <c-p>Alles hangt samen. Klik een laag aan om door te dalen, of volg de keten van persoon naar team, app, instance, rack en datacenter.</c-p>
        <c-stack gap="0.75rem">
{layers()}
        </c-stack>
      </c-card>

      <c-card outline padding="lg">
        <c-section-head title="Recente activiteit" icon="timer"/>
        <c-activity>
{activity()}
        </c-activity>
      </c-card>
    </c-columns>
  </c-stack>
</c-app-shell>
</c-page>
"""


if __name__ == "__main__":
    OUT.write_text(build(), encoding="utf-8")
    print(f"Wrote {OUT} ({len(OUT.read_text())} bytes)")

"""Generate the bg.rijks.app Overzicht recreation using ONLY LOTC <c-*> components.

Deliberately uses NO app-specific CSS (the real site's `rp-*` scoped styles).
This is the honest "what can the component system express today" measurement:
whatever looks off, or is missing, is a genuine component gap — documented in
tests/visual/BG_OVERZICHT_GAPS.md.

Data (icons, labels, grouping) is extracted verbatim from the live site DOM.
Run:  python tests/visual/gen_bg_overzicht.py  ->  fixtures/bg-overzicht.html
"""

from __future__ import annotations

from pathlib import Path

OUT = Path(__file__).resolve().parent / "fixtures" / "bg-overzicht.html"

# ── extracted from https://bg.rijks.app/ (nldd-icon name | label | href) ────────
# Grouping mirrors the <p class="rp-sidenav-group"> section headers.
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


def sidenav() -> str:
    rows: list[str] = []
    for group, items in SIDENAV:
        if group:
            rows.append(f'      <c-small><strong>{group.upper()}</strong></c-small>')
        for icon, label, href in items:
            active = ' active' if href == "/" else ''
            rows.append(
                f'      <c-stack direction="horizontal" gap="0.6rem">'
                f'<c-icon icon="{icon}" size="sm"/>'
                f'<c-link href="{href}"{active}>{label}</c-link></c-stack>'
            )
    return "\n".join(rows)


def metric_card(icon: str, value: str, label: str, sub: str, href: str) -> str:
    # c-h2 stands in for the missing "metric/stat value" display type (semantic hack).
    return (
        f'    <c-card href="{href}" outline>\n'
        f'      <c-stack gap="0.25rem">\n'
        f'        <c-stack direction="horizontal" gap="0.5rem">'
        f'<c-icon icon="{icon}"/><c-h2>{value}</c-h2></c-stack>\n'
        f'        <strong>{label}</strong>\n'
        f'        <c-small>{sub}</c-small>\n'
        f'      </c-stack>\n'
        f'    </c-card>'
    )


LAYERS_CARD = """    <c-card outline>
      <c-h2>De lagen van het platform</c-h2>
      <c-tag type="default">persoon → datacenter</c-tag>
      <c-p>Alles hangt samen. Klik een laag aan om door te dalen, of volg de keten van persoon naar team, app, instance, rack en datacenter.</c-p>
      <c-stack gap="0.75rem">
        <c-card><c-stack gap="0.25rem"><strong>Applicaties</strong><c-small>123 apps — Wat burgers en ambtenaren gebruiken</c-small>
          <c-stack direction="horizontal" gap="0.35rem" wrap><c-tag type="default">Paspoortaanvraag</c-tag><c-tag type="default">Toeslagenmotor</c-tag><c-tag type="default">Platformportaal</c-tag></c-stack></c-stack></c-card>
        <c-card><c-stack gap="0.25rem"><strong>Infra-diensten</strong><c-small>244 instances — Kubernetes, databases, brokers, LLM</c-small>
          <c-stack direction="horizontal" gap="0.35rem" wrap><c-tag type="default">pg-burgerzaken-prod</c-tag><c-tag type="default">k8s-platform-prod</c-tag></c-stack></c-stack></c-card>
        <c-card><c-stack gap="0.25rem"><strong>Fundament</strong><c-small>35 racks — Datacenters, racks en hardware</c-small></c-stack></c-card>
      </c-stack>
    </c-card>"""

ACTIVITY_CARD = """    <c-card outline>
      <c-h2>Recente activiteit</c-h2>
      <c-stack gap="0.75rem">
        <div><strong>Anne Schuth</strong> infra afgenomen<br><c-small>llm-gilde-prod · di 10:02</c-small></div>
        <div><strong>Fatima El Amrani</strong> secret geroteerd<br><c-small>platform/llm-gateway-key · di 09:40</c-small></div>
        <div><strong>Joost de Vries</strong> release gepromoot<br><c-small>app-paspoort → prod · gisteren 14:22</c-small></div>
        <div><strong>Omar Van Es</strong> release gepromoot<br><c-small>app-subsidieportaal-rvo → prod · gisteren 9:11</c-small></div>
      </c-stack>
    </c-card>"""


def build() -> str:
    cards = "\n".join(metric_card(*m) for m in METRICS)
    return f"""<!DOCTYPE html>
<html lang="nl"><head><meta charset="UTF-8"><title>Overzicht · Begane Grond (LOTC pure components)</title></head>
<body>
<!-- GAP: no c-status-bar component (site uses <nldd-status-bar>). -->
<!-- GAP: c-header renders <nldd-top-navigation-bar> but has no utility-menu slot
     (site puts Zoeken/Notificaties/Nieuw/Thema/profiel in an <nldd-menu-bar slot="utility">). -->

<c-app-shell width="16rem">
  <template slot="header">
    <c-header text="Begane Grond" subtitle="developer platform voor de Rijksoverheid" link="/"/>
  </template>

  <template slot="sidebar">
    <c-stack gap="0.15rem">
{sidenav()}
    </c-stack>
  </template>

  <c-stack gap="1.25rem">
    <div>
      <c-h1>Begane Grond</c-h1>
      <c-p>Welkom Anne, één plek voor fysieke infra, diensten, applicaties en teams van de Rijksoverheid.</c-p>
    </div>

    <c-stack direction="horizontal" gap="0.75rem">
      <c-button type="secondary" label="Mijn overzicht" icon="person" show-icon="before"/>
      <c-button type="primary" label="Nieuwe applicatie" icon="plus" show-icon="before"/>
    </c-stack>

    <c-auto-grid min="220px" gap="1rem">
{cards}
    </c-auto-grid>

    <c-columns columns="1" lg="2" gap="1.5rem">
{LAYERS_CARD}
{ACTIVITY_CARD}
    </c-columns>
  </c-stack>
</c-app-shell>
</body></html>
"""


if __name__ == "__main__":
    OUT.write_text(build(), encoding="utf-8")
    print(f"Wrote {OUT} ({len(OUT.read_text())} bytes)")

"""Generate the bg.rijks.app /zelf ("Mijn overzicht") recreation.

Reuses the Overzicht sidenav + header, adds the personal-dashboard components
(c-identity, c-action, c-detail-list, c-notification, c-section-link). Built
100% from c-* components under design_systems=["nldd", "bgnldd"].

Run:  python tests/visual/gen_zelf.py  ->  fixtures/zelf.html
"""

from __future__ import annotations

from pathlib import Path

import gen_bg_overzicht as bg  # sidenav data + helper

OUT = Path(__file__).resolve().parent / "fixtures" / "zelf.html"


def sidenav() -> str:
    # Same sidebar, but "Mijn overzicht" (/zelf) is the active item here.
    rows: list[str] = []
    for group, items in bg.SIDENAV:
        if group:
            rows.append(f'      <c-sidenav-group label="{group}"/>')
        for icon, label, href in items:
            active = ' active' if href == "/zelf" else ''
            rows.append(f'      <c-sidenav-item icon="{icon}" label="{label}" href="{href}"{active}/>')
    return "\n".join(rows)


METRICS = [
    ("rectangle-stack", "1", "Mijn apps", "services en sites", "/apps"),
    ("cylinder-split", "2", "Afgenomen infra", "instances van mijn team", "/infra"),
    ("euro-sign", "€ 1.300", "Infra-kosten", "per maand", "/kosten"),
    ("check-mark-circle", "2", "Openstaande acties", "vragen om aandacht", "#acties"),
]

ACTIONS = [
    ("lock-closed", "Roteer secret platform/llm-gateway-key",
     "Verloopt over 89 dagen · laatst geroteerd 1 dag geleden", "warning", "Roteren"),
    ("check-mark-circle", "Keur change goed: Nieuwe leaf-switch DH-A3",
     "Risico laag · venster wo 20:00", "neutral", "Naar wijzigingen"),
]

WERKPLEK = [
    ("Hardware", "Rijkslaptop Linux 14″"),
    ("Image", "Autonome werkplek 13"),
    ("Encryptie", "volledig"),
    ("Updates", "bij"),
    ("Gezien", "2 min geleden"),
]

NOTIFICATIONS = [
    ("exclamation-triangle", "Verhoogde latency Toeslagenmotor", "error", "Incident geopend", "system · vandaag 09:14"),
    ("envelope", "Nieuwe teamgenoot: Sanne Bakker", "info", "Team", "platform · gisteren 16:20"),
]

DOORKLIKKEN = [
    ("person", "Mijn profiel: Anne Schuth", "/teams/mensen/ans"),
    ("person-2", "Platform Engineering", "/teams/team-platform"),
    ("rectangle-stack", "Platformportaal", "/apps/platformportaal"),
    ("cylinder-split", "k8s-platform-prod", "/infra/k8s-platform-prod"),
]


def metrics() -> str:
    return "\n".join(
        f'      <c-metric icon="{i}" value="{v}" label="{lbl}" sub="{s}" href="{h}"/>'
        for i, v, lbl, s, h in METRICS
    )


def actions() -> str:
    out = []
    for icon, title, sub, tone, btn in ACTIONS:
        out.append(
            f'          <c-action icon="{icon}" title="{title}" sub="{sub}" tone="{tone}">'
            f'<c-button type="primary" label="{btn}"/></c-action>'
        )
    return "\n".join(out)


def werkplek() -> str:
    return "\n".join(
        f'          <c-detail-item label="{k}" value="{v}"/>' for k, v in WERKPLEK
    )


def notifications() -> str:
    out = []
    for icon, title, ttype, tag, meta in NOTIFICATIONS:
        out.append(
            f'          <c-notification-item icon="{icon}" title="{title}">'
            f'<c-tag type="{ttype}">{tag}</c-tag> {meta}</c-notification-item>'
        )
    return "\n".join(out)


def doorklikken() -> str:
    return "\n".join(
        f'          <c-section-link icon="{i}" label="{lbl}" href="{h}"/>'
        for i, lbl, h in DOORKLIKKEN
    )


def build() -> str:
    return f"""<c-page title="Mijn overzicht · Begane Grond" lang="nl" design-systems="lotc-layout nldd bgnldd">
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
    <c-breadcrumbs>
      <c-breadcrumbs-item label="Home" href="/"/>
      <c-breadcrumbs-item label="Mijn overzicht"/>
    </c-breadcrumbs>

    <c-stack direction="horizontal" justify="between" align="start" gap="1.5rem" wrap>
      <div>
        <c-heading type="h1" size="2">Welkom, Anne</c-heading>
        <c-p>Ingelogd op developer.overheid.nl als Platform engineer bij Nederlandse Digitale Dienst. Alles wat van jou en je team is, op één plek.</c-p>
      </div>
      <c-stack direction="horizontal" gap="0.75rem">
        <c-button type="secondary" label="Nieuwe app" icon="plus" show-icon="before"/>
        <c-button type="primary" label="Infra afnemen" icon="plus" show-icon="before"/>
      </c-stack>
    </c-stack>

    <c-card outline padding="lg">
      <c-identity name="Anne Schuth" initials="AS" handle="@anne:rijk.chat"
                  aside-tag="Escalatie-piket" aside-tag-type="warning"
                  aside-sub="achter Fatima El Amrani" aside-label="Piketrooster" aside-href="/teams/on-call">
        <c-tag type="info">Platform engineer</c-tag><c-tag type="info">Platform Engineering</c-tag>
      </c-identity>
    </c-card>

    <c-auto-grid min="220px" gap="1rem">
{metrics()}
    </c-auto-grid>

    <c-columns columns="1" lg="2" gap="1.5rem">
      <c-stack gap="1.5rem">
        <c-card outline padding="lg">
          <c-section-head title="Openstaande acties"><c-tag type="warning">2</c-tag></c-section-head>
          <c-stack gap="0.6rem">
{actions()}
          </c-stack>
        </c-card>

        <c-card outline padding="lg">
          <c-section-head title="Mijn notificaties"/>
          <c-notification>
{notifications()}
          </c-notification>
        </c-card>
      </c-stack>

      <c-stack gap="1.5rem">
        <c-card outline padding="lg">
          <c-section-head title="Mijn werkplek"/>
          <c-detail-list id="wp-0001" icon="business-suitcase" href="/werkplekken/wp-0001">
{werkplek()}
          </c-detail-list>
          <c-button type="secondary" label="Werkplek aanvragen" icon="plus" show-icon="before"/>
        </c-card>

        <c-card outline padding="lg">
          <c-section-head title="Doorklikken"/>
          <c-stack gap="0.4rem">
{doorklikken()}
          </c-stack>
        </c-card>
      </c-stack>
    </c-columns>
  </c-stack>
</c-app-shell>
</c-page>
"""


if __name__ == "__main__":
    OUT.write_text(build(), encoding="utf-8")
    print(f"Wrote {OUT} ({len(OUT.read_text())} bytes)")

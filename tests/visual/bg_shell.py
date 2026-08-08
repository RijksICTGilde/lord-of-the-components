"""Shared skeleton + helpers for the bg.rijks.app recreations.

The expensive part of recreating a Begane Grond screen — the app-shell, the header
with its utility menu, and the full 45-item sidebar navigation (extracted verbatim
from the live site) — lives here once. A new bg screen only writes its own main
content and says which nav item is active:

    from bg_shell import shell
    shell(main, title="… · Begane Grond", active_href="/artefacten")

Also holds reusable card helpers (artifact_card) for patterns that recur across
screens but aren't (yet) core LOTC components.
"""

from __future__ import annotations

# ── the sidebar navigation, extracted from https://bg.rijks.app/ ────────────
# (nldd-icon name | label | href), grouped; group is None for the top items.
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
        ("clipboard", "Privacy & DPIA", "/verwerkingen"),
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


def sidenav(active_href: str) -> str:
    """The full sidebar, with the item whose href == active_href marked active."""
    rows: list[str] = []
    for group, items in SIDENAV:
        if group:
            rows.append(f'      <c-sidenav-group label="{group}"/>')
        for icon, label, href in items:
            active = " active" if href == active_href else ""
            rows.append(f'      <c-sidenav-item icon="{icon}" label="{label}" href="{href}"{active}/>')
    return "\n".join(rows)


def shell(main: str, *, title: str, active_href: str, head: str = "", footer: str = "") -> str:
    """Wrap `main` in the full Begane Grond shell (status-bar + header + utility
    menu + sidebar). `head` is extra markup between <c-page> and <c-app-shell>
    (e.g. a <style> block); `footer` fills the app-shell footer slot."""
    head_block = f"{head}\n" if head else ""
    footer_block = (
        f'\n\n  <template slot="footer">\n{footer}\n  </template>' if footer else ""
    )
    return f"""<c-page title="{title}" lang="nl" design-systems="lotc-layout nldd">
{head_block}<c-app-shell width="16rem">
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
{sidenav(active_href)}
    </c-sidenav>
  </template>

{main}{footer_block}
</c-app-shell>
</c-page>
"""


def artifact_card(name, ver, digest, status, kind, slsa, comps, repo) -> str:
    """A resource-listing card (bg's Artefactregister): icon + name/version, a
    mono digest, a signed/unsigned status tag, a tag row, and a repo line.
    Needs the .art-* styles (see gen_artefacten.STYLE)."""
    stype = "success" if status == "ondertekend" else "error"
    return f"""      <c-card outline padding="md">
        <div class="art-head">
          <c-icon icon="folder-stack" size="md" class="art-icon"/>
          <div class="art-titles">
            <c-heading type="h2" size="4">{name} <span class="art-ver">{ver}</span></c-heading>
            <p class="art-digest">{digest}</p>
          </div>
          <c-tag type="{stype}">{status}</c-tag>
        </div>
        <div class="art-tags">
          <c-tag>{kind}</c-tag><c-tag type="info">SLSA {slsa}</c-tag><c-tag>{comps} componenten</c-tag>
        </div>
        <p class="art-repo"><c-icon icon="chevron-left-forward-slash-chevron-right" size="2xs"/>{repo}</p>
      </c-card>"""

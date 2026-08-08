"""Generate the bg.rijks.app /apps ("Software-catalogus") recreation.

Reuses the Overzicht sidenav + header, adds the catalog page: three metrics, a
filter-bar (search + Team/Type/Maturity dropdowns), and a grid of catalog-cards
(one per application: icon + title/team + status, a tag row, and a maturity +
open footer). Built 100% from c-* components under nldd.

Run (from tests/visual/):  python gen_apps.py  ->  fixtures/apps.html
"""

from __future__ import annotations

from pathlib import Path

from bg_shell import shell  # shared page shell + sidenav

OUT = Path(__file__).resolve().parent / "fixtures" / "apps.html"

APP_ICON = "rectangle-stack"

METRICS = [
    ("rectangle-stack", "123", "Applicaties", "in de catalogus"),
    ("certificate", "41", "Goud", "volgt het gebaande pad"),
    ("exclamation-triangle", "31", "Aandacht", "health niet groen"),
]

# title, team, status, status-type, [(type, *stack)], maturity
APPS = [
    ("Paspoortaanvraag", "Burgerzaken", "ok", "success", ("service", "Rust", "Postgres"), "goud"),
    ("Toeslagenmotor", "Toeslagen", "warn", "warning", ("service", "Rust", "Kafka", "Postgres"), "zilver"),
    ("Platformportaal", "Platform Engineering", "ok", "success", ("website", "Vue", "NLDD"), "goud"),
    ("Datadeling-API", "Data & koppelvlakken", "ok", "success", ("service", "Python", "Postgres"), "brons"),
    ("Kentekencheck", "StatLine & Publicatie", "ok", "success", ("service", "Go", "Postgres"), "zilver"),
    ("Studiefinanciering portaal", "Onderwijsregister", "warn", "warning", ("website", "Vue", "NLDD", "Java"), "brons"),
    ("Vergunningchecker", "Vergunningen & Regelingen", "ok", "success", ("service", "Kotlin", "Postgres"), "zilver"),
    ("Inkomenstoets", "Inning & Invordering", "ok", "success", ("service", "Java", "Oracle"), "goud"),
    ("Aangifte Omzetbelasting", "Aangifteplatform", "warn", "warning", ("service", "Java", "Kafka"), "zilver"),
]


def metrics() -> str:
    return "\n".join(
        f'      <c-metric icon="{i}" value="{v}" label="{lbl}" sub="{s}"/>'
        for i, v, lbl, s in METRICS
    )


def cards() -> str:
    out = []
    for title, team, status, stype, tags, maturity in APPS:
        type_tag = f'<c-tag type="default">{tags[0]}</c-tag>'
        stack_tags = "".join(f'<c-tag type="info">{t}</c-tag>' for t in tags[1:])
        out.append(
            f'      <c-catalog-card icon="{APP_ICON}" title="{title}" subtitle="{team}"'
            f' status="{status}" status-type="{stype}" maturity="{maturity}"'
            f' open-label="Open" href="/apps/{title.lower().replace(" ", "-")}">'
            f"{type_tag}{stack_tags}</c-catalog-card>"
        )
    return "\n".join(out)


def build() -> str:
    main = f"""  <c-stack gap="1.25rem">
    <c-breadcrumbs>
      <c-breadcrumbs-item label="Home" href="/"/>
      <c-breadcrumbs-item label="Applicaties"/>
    </c-breadcrumbs>

    <c-stack direction="horizontal" justify="between" align="start" gap="1.5rem">
      <div>
        <c-heading type="h1" size="2">Software-catalogus</c-heading>
        <c-p>Alle applicaties van het Begane Grond op één plek. Elke applicatie hangt aan een team, een repository en de infra waarop hij draait.</c-p>
      </div>
      <c-stack direction="horizontal" gap="0.75rem">
        <c-button type="secondary" label="Gebaande paden" icon="books-vertical" show-icon="before"/>
        <c-button type="primary" label="Nieuwe applicatie" icon="plus" show-icon="before"/>
      </c-stack>
    </c-stack>

    <c-auto-grid min="280px" gap="1rem">
{metrics()}
    </c-auto-grid>

    <c-filter-bar placeholder="Naam, team of stack…" count="123 van 123 applicaties" clear-label="Filters wissen">
      <c-filter-select label="Team" value="Alle teams"/>
      <c-filter-select label="Type" value="Alle types"/>
      <c-filter-select label="Maturity" value="Alle"/>
    </c-filter-bar>

    <c-auto-grid min="320px" gap="1rem">
{cards()}
    </c-auto-grid>
  </c-stack>"""
    footer = """    <c-site-footer text="Begane Grond — demo / mock-up" note-label="Presentatie" note="Shift + P · kies een rol" note-icon="eye">
      <c-link href="/standaarden">Toegankelijkheid</c-link>
    </c-site-footer>"""
    return shell(
        main,
        title="Software-catalogus · Begane Grond",
        active_href="/apps",
        footer=footer,
    )


if __name__ == "__main__":
    OUT.write_text(build(), encoding="utf-8")
    print(f"Wrote {OUT} ({len(OUT.read_text())} bytes)")

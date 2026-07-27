"""RVO fidelity compare harness.

Renders each case twice — through the reference RVO implementation
(jinja-roos-components, the predecessor) and through Lord of the Components — and
writes a side-by-side HTML page so the two can be compared visually under the
same RVO CSS. Where they differ, LOTC is missing a class / wrapper / context.

Run:  python tests/visual/compare.py            # writes fixtures/_compare-rvo.html
Then serve it with serve.py (--theme rvo) and screenshot.
"""

from __future__ import annotations

import sys
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

PYTHON_SRC = Path(__file__).resolve().parent.parent.parent / "python" / "src"
sys.path.insert(0, str(PYTHON_SRC))

from lord_of_the_components import setup_components as lotc_setup  # noqa: E402

PKG = PYTHON_SRC / "lord_of_the_components"
FIXTURES = Path(__file__).resolve().parent / "fixtures"


# (label, reference markup [jinja-roos syntax], LOTC markup) ---------------------
CASES: list[tuple[str, str, str]] = [
    ("heading h2", '<c-heading type="h2">Kop niveau 2</c-heading>', '<c-heading type="h2">Kop niveau 2</c-heading>'),
    ("paragraph", "<c-paragraph>Een paragraaf met tekst.</c-paragraph>", "<c-paragraph>Een paragraaf met tekst.</c-paragraph>"),
    ("link", '<c-link href="#">Een link</c-link>', '<c-link href="#">Een link</c-link>'),
    ("button primary", '<c-button kind="primary" label="Opslaan"></c-button>', '<c-button type="primary" label="Opslaan"/>'),
    ("button secondary", '<c-button kind="secondary" label="Annuleren"></c-button>', '<c-button type="secondary" label="Annuleren"/>'),
    ("alert info", '<c-alert kind="info" heading="Ter info">Een informatief bericht.</c-alert>', '<c-alert type="info" heading="Ter info">Een informatief bericht.</c-alert>'),
    ("alert warning", '<c-alert kind="warning" heading="Let op">Een waarschuwing.</c-alert>', '<c-alert type="warning" heading="Let op">Een waarschuwing.</c-alert>'),
    ("card", '<c-card title="Kaarttitel">Inhoud van de kaart.</c-card>', '<c-card title="Kaarttitel">Inhoud van de kaart.</c-card>'),
    ("label", "", '<c-label label="Veldlabel"/>'),
    ("hero", '<c-hero title="Hero titel" subtitle="Ondertitel"></c-hero>', '<c-hero title="Hero titel" subtitle="Ondertitel"/>'),
    # Data-driven / structural components (reference syntax diverges — LOTC only).
    (
        "menu",
        "",
        '<c-menu type="horizontal"><c-menu-item label="Home" href="/"/>'
        '<c-menu-item label="Aanvragen" href="/a"/><c-menu-item label="Documenten" href="/d"/></c-menu>',
    ),
    (
        "breadcrumbs",
        "",
        '<c-breadcrumbs><c-breadcrumbs-item label="Home" href="/"/>'
        '<c-breadcrumbs-item label="Aanvragen" href="/a"/><c-breadcrumbs-item label="Detail" href="/a/1"/></c-breadcrumbs>',
    ),
    (
        "data-list",
        "",
        "<c-data-list>"
        '<dt class="rvo-data-list__term">Naam</dt><dd class="rvo-data-list__description">Jan de Vries</dd>'
        '<dt class="rvo-data-list__term">Rol</dt><dd class="rvo-data-list__description">Beheerder</dd>'
        "</c-data-list>",
    ),
    ("header", "", '<c-header text="Mijn Organisatie" subtitle="Zelfservice portaal"/>'),
    ("footer", "", '<c-footer pay-off="Samen digitaal"/>'),
    ("tag + badge", "", '<c-tag type="info">Concept</c-tag> <c-badge type="error" label="3"/>'),
    ("max-width-layout", "", '<c-max-width-layout><c-paragraph>Inhoud met max breedte.</c-paragraph></c-max-width-layout>'),
]


def _reference_env() -> Environment | None:
    try:
        from jinja_roos_components import setup_components as ref_setup
    except ImportError:
        return None
    env = Environment(loader=FileSystemLoader([]))
    ref_setup(env)
    return env


def _lotc_env() -> Environment:
    env = Environment(loader=FileSystemLoader([str(PKG / "templates")]), autoescape=True)
    lotc_setup(env, design_systems=["rvo"], registry_path=str(PKG / "registry.json"))
    return env


def _render(env: Environment | None, src: str) -> str:
    if not src:
        return '<em style="color:#aaa">— (reference syntax diverges)</em>'
    if env is None:
        return '<em style="color:#888">reference unavailable</em>'
    try:
        return env.from_string(src).render()
    except Exception as exc:  # noqa: BLE001 - report render errors inline for the visual diff
        return f'<pre style="color:#b00;white-space:pre-wrap">{type(exc).__name__}: {exc}</pre>'


def main() -> None:
    ref = _reference_env()
    lotc = _lotc_env()

    rows = []
    for label, ref_src, lotc_src in CASES:
        rows.append(
            f"""
            <tr>
              <th class="cmp-label">{label}</th>
              <td class="cmp-cell">{_render(ref, ref_src)}</td>
              <td class="cmp-cell">{_render(lotc, lotc_src)}</td>
            </tr>"""
        )

    html = f"""<!DOCTYPE html>
<html lang="nl"><head><meta charset="UTF-8"><title>RVO compare</title>
<style>
  body {{ font-family: sans-serif; }}
  table.cmp {{ border-collapse: collapse; width: 100%; }}
  table.cmp th.cmp-head {{ text-align: left; padding: .5rem; background: #f3f3f3; border-bottom: 2px solid #ccc; }}
  table.cmp th.cmp-label {{ text-align: left; padding: 1rem .5rem; vertical-align: top; width: 10rem; color: #555; font-weight: 600; }}
  table.cmp td.cmp-cell {{ padding: 1rem; vertical-align: top; border-bottom: 1px solid #eee; width: 45%; }}
  table.cmp td.cmp-cell:nth-child(2) {{ border-right: 1px solid #ddd; background: #fafcff; }}
</style>
</head>
<body>
  <h1>RVO compare — reference (jinja-roos) vs Lord of the Components</h1>
  <table class="cmp">
    <tr><th class="cmp-head">component</th><th class="cmp-head">reference (direct)</th><th class="cmp-head">via LOTC</th></tr>
    {"".join(rows)}
  </table>
</body></html>
"""
    out = FIXTURES / "_compare-rvo.html"
    out.write_text(html, encoding="utf-8")
    print(f"Wrote {out} ({len(CASES)} cases, reference={'yes' if ref else 'MISSING'})")


if __name__ == "__main__":
    main()

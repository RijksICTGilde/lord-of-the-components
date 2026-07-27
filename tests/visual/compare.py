"""Systematic fidelity comparison harness.

For each component and theme it produces two isolated, single-component pages:

    <component>-<theme>-original   the reference / direct rendering (how it SHOULD look)
    <component>-<theme>-rendered   the output via Lord of the Components

The "original" reference is:
  * RVO  — rendered through jinja-roos-components (the predecessor), pre-rendered
           to static HTML here so serve.py just serves it with the RVO CSS.
  * NLDD — hand-written ideal `<nldd-*>` markup (the storybook's intended usage),
           served with the NLDD bundle.

This writes one fixture per (component, theme, kind) into tests/visual/fixtures/
(prefixed `_cmp_`, gitignored) plus a manifest JSON. `compare_shoot.mjs` reads the
manifest, screenshots each in isolation, and saves them as
screenshots/compare/<component>-<theme>-<kind>.png.

Run:  python tests/visual/compare.py   then   node tests/visual/compare_shoot.mjs
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Optional

from jinja2 import Environment, FileSystemLoader

PYTHON_SRC = Path(__file__).resolve().parent.parent.parent / "python" / "src"
sys.path.insert(0, str(PYTHON_SRC))

from lord_of_the_components import setup_components as lotc_setup  # noqa: E402

PKG = PYTHON_SRC / "lord_of_the_components"
FIXTURES = Path(__file__).resolve().parent / "fixtures"
MANIFEST = Path(__file__).resolve().parent / "_cmp_manifest.json"


class Case:
    """One component comparison.

    lotc:     the <c-*> markup (rendered via LOTC under each theme).
    rvo_ref:  jinja-roos markup for the RVO reference (None -> no RVO original).
    nldd_ref: ideal <nldd-*> markup for the NLDD reference (None -> no NLDD original).
    """

    def __init__(self, name: str, lotc: str, rvo_ref: Optional[str], nldd_ref: Optional[str]):
        self.name = name
        self.lotc = lotc
        self.rvo_ref = rvo_ref
        self.nldd_ref = nldd_ref


CASES: list[Case] = [
    Case(
        "button",
        '<c-button type="primary" label="Opslaan"/>',
        '<c-button kind="primary" label="Opslaan"></c-button>',
        '<nldd-button variant="primary" text="Opslaan"></nldd-button>',
    ),
    Case(
        "button-icon-after",
        '<c-button type="primary" label="Volgende" icon="arrow-right" show-icon="after"/>',
        '<c-button kind="primary" label="Volgende" icon="pijl-naar-rechts" showIcon="after"></c-button>',
        '<nldd-button variant="primary" text="Volgende" end-icon="arrow-right"></nldd-button>',
    ),
    Case(
        "button-icon-before",
        '<c-button type="secondary" label="Terug" icon="arrow-left" show-icon="before"/>',
        '<c-button kind="secondary" label="Terug" icon="pijl-naar-links" showIcon="before"></c-button>',
        '<nldd-button variant="secondary" text="Terug" start-icon="arrow-left"></nldd-button>',
    ),
    Case(
        "tag",
        '<c-tag type="info">Concept</c-tag>',
        '<c-tag type="info">Concept</c-tag>',
        '<nldd-tag color="accent">Concept</nldd-tag>',
    ),
    Case(
        "alert-info",
        '<c-alert type="info" heading="Ter info">Een informatief bericht.</c-alert>',
        '<c-alert kind="info" heading="Ter info">Een informatief bericht.</c-alert>',
        '<nldd-banner variant="accent" text="Ter info">Een informatief bericht.</nldd-banner>',
    ),
    Case(
        "alert-success",
        '<c-alert type="success" heading="Gelukt">Opgeslagen.</c-alert>',
        '<c-alert kind="success" heading="Gelukt">Opgeslagen.</c-alert>',
        '<nldd-banner variant="success" text="Gelukt">Opgeslagen.</nldd-banner>',
    ),
    Case(
        "checkbox",
        '<c-checkbox label="Ik ga akkoord" name="a" value="ja" checked/>',
        '<c-checkbox label="Ik ga akkoord" name="a" checked></c-checkbox>',
        '<nldd-checkbox-field label="Ik ga akkoord" name="a" checked></nldd-checkbox-field>',
    ),
    Case(
        "card",
        '<c-card title="Aanvragen" href="#" outline>Bekijk je aanvragen.</c-card>',
        '<c-card title="Aanvragen" href="#" outline="true">Bekijk je aanvragen.</c-card>',
        '<nldd-card href="#"><span slot="header">Aanvragen</span>Bekijk je aanvragen.</nldd-card>',
    ),
    Case(
        "tabs",
        '<c-tabs><c-tab label="Overzicht" href="#" active/><c-tab label="Details" href="#"/></c-tabs>',
        None,  # jinja-roos tabs template classes don't match its CSS -> not a fair oracle
        '<nldd-tab-bar><nldd-tab-bar-item text="Overzicht" href="#" selected></nldd-tab-bar-item>'
        '<nldd-tab-bar-item text="Details" href="#"></nldd-tab-bar-item></nldd-tab-bar>',
    ),
    Case(
        "heading",
        '<c-heading type="h2">Kop niveau 2</c-heading>',
        '<c-heading type="h2">Kop niveau 2</c-heading>',
        '<nldd-title><span>Kop niveau 2</span></nldd-title>',
    ),
    Case(
        "link",
        '<c-link href="#">Een link</c-link>',
        '<c-link href="#">Een link</c-link>',
        '<nldd-link href="#" text="Een link"></nldd-link>',
    ),
    Case(
        "paragraph",
        "<c-paragraph>Een paragraaf met wat tekst erin.</c-paragraph>",
        "<c-paragraph>Een paragraaf met wat tekst erin.</c-paragraph>",
        "<p>Een paragraaf met wat tekst erin.</p>",
    ),
    Case(
        "badge",
        '<c-badge type="error" label="3"/>',
        None,
        '<nldd-badge color="critical" text="3"></nldd-badge>',
    ),
    Case(
        "radio",
        '<c-radio name="k" value="a" label="Optie A" checked/>',
        None,
        '<nldd-radio-button-field name="k" value="a" label="Optie A" checked></nldd-radio-button-field>',
    ),
    Case(
        "text-input",
        '<c-text-input name="e" type="email" placeholder="naam@voorbeeld.nl"/>',
        None,
        '<nldd-text-field name="e" type="email" placeholder="naam@voorbeeld.nl"></nldd-text-field>',
    ),
    Case(
        "textarea",
        '<c-textarea name="m" placeholder="Typ een bericht"/>',
        '<c-textarea name="m" placeholder="Typ een bericht"></c-textarea>',
        '<nldd-multi-line-text-field name="m" placeholder="Typ een bericht"></nldd-multi-line-text-field>',
    ),
    Case(
        "select",
        '<c-select name="p" placeholder="Kies..."><c-option value="ut" label="Utrecht"/>'
        '<c-option value="nh" label="Noord-Holland"/></c-select>',
        None,
        '<nldd-combo-box name="p" placeholder="Kies..."><nldd-menu>'
        '<nldd-menu-item value="ut" text="Utrecht"></nldd-menu-item>'
        '<nldd-menu-item value="nh" text="Noord-Holland"></nldd-menu-item></nldd-menu></nldd-combo-box>',
    ),
    Case(
        "breadcrumbs",
        '<c-breadcrumbs><c-breadcrumbs-item label="Home" href="/"/>'
        '<c-breadcrumbs-item label="Aanvragen" href="/a"/>'
        '<c-breadcrumbs-item label="Detail"/></c-breadcrumbs>',
        None,  # jinja-roos has no breadcrumbs component
        '<nldd-breadcrumbs><nldd-breadcrumbs-item text="Home" href="/"></nldd-breadcrumbs-item>'
        '<nldd-breadcrumbs-item text="Aanvragen" href="/a"></nldd-breadcrumbs-item>'
        '<nldd-breadcrumbs-item text="Detail"></nldd-breadcrumbs-item></nldd-breadcrumbs>',
    ),
    Case(
        "table",
        '<c-table columns="1fr 1fr"><c-table-head><c-th>Naam</c-th><c-th>Rol</c-th></c-table-head>'
        '<c-table-row><c-td>Jan de Vries</c-td><c-td>Beheerder</c-td></c-table-row>'
        '<c-table-row><c-td>Aisha Bakker</c-td><c-td>Ontwikkelaar</c-td></c-table-row></c-table>',
        None,
        '<nldd-table columns="1fr 1fr"><nldd-table-row slot="header">'
        '<nldd-cell>Naam</nldd-cell><nldd-cell>Rol</nldd-cell></nldd-table-row>'
        '<nldd-table-row><nldd-cell>Jan de Vries</nldd-cell><nldd-cell>Beheerder</nldd-cell></nldd-table-row>'
        '<nldd-table-row><nldd-cell>Aisha Bakker</nldd-cell><nldd-cell>Ontwikkelaar</nldd-cell></nldd-table-row></nldd-table>',
    ),
]


# ── reference rendering ─────────────────────────────────────────────────────────


def _rvo_reference_env() -> Optional[Environment]:
    try:
        from jinja_roos_components import setup_components as ref_setup
    except ImportError:
        return None
    env = Environment(loader=FileSystemLoader([]))
    ref_setup(env)
    return env


def _page(body: str) -> str:
    return (
        '<!DOCTYPE html><html lang="nl"><head><meta charset="UTF-8">'
        "<title>compare</title></head><body>"
        f'<div id="cmp-root">{body}</div></body></html>'
    )


def main() -> None:
    ref = _rvo_reference_env()
    manifest: list[dict[str, str]] = []

    def write(name: str, theme: str, kind: str, body: str) -> None:
        fixture = f"_cmp_{name}__{theme}__{kind}.html"
        (FIXTURES / fixture).write_text(_page(body), encoding="utf-8")
        manifest.append(
            {"component": name, "theme": theme, "kind": kind, "fixture": fixture}
        )

    for case in CASES:
        # rendered: raw <c-*>, served through LOTC per theme.
        write(case.name, "rvo", "rendered", case.lotc)
        write(case.name, "nldd", "rendered", case.lotc)

        # original (RVO): pre-render jinja-roos to static HTML.
        if case.rvo_ref and ref is not None:
            try:
                html = ref.from_string(case.rvo_ref).render()
            except Exception as exc:  # noqa: BLE001
                html = f'<pre style="color:#b00">{type(exc).__name__}: {exc}</pre>'
            write(case.name, "rvo", "original", html)

        # original (NLDD): ideal static <nldd-*> markup.
        if case.nldd_ref:
            write(case.name, "nldd", "original", case.nldd_ref)

    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    # Touch the LOTC env once so an import error surfaces here, not in the browser.
    env = Environment(loader=FileSystemLoader([str(PKG / "templates")]), autoescape=True)
    lotc_setup(env, design_systems=["rvo"], registry_path=str(PKG / "registry.json"))
    print(f"Wrote {len(manifest)} fixtures + {MANIFEST.name} (rvo reference: {'yes' if ref else 'MISSING'})")


if __name__ == "__main__":
    main()

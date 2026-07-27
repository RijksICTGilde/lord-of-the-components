"""NLDD implementations for card and alert (jinja-backend, per-theme templates).

card and alert are jinja-backend (their RVO impls use elseChildren / complex
conditionals), so each theme ships its own template: lotc-rvo renders the RVO
markup, lotc-nldd renders the NLDD web components. The loader resolves the right
one from the active design system's templates_path.
"""

from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components

PKG = Path(__file__).resolve().parent.parent / "src" / "lord_of_the_components"


def _env(theme):
    env = Environment(loader=FileSystemLoader([str(PKG / "templates")]), autoescape=True)
    setup_components(env, design_systems=[theme], registry_path=str(PKG / "registry.json"))
    return env


# ── card ───────────────────────────────────────────────────────────────────────


def test_card_rvo():
    html = _env("rvo").from_string('<c-card title="Titel">Inhoud</c-card>').render()
    assert "rvo-card" in html and "nldd-card" not in html


def test_card_nldd():
    html = _env("nldd").from_string('<c-card title="Titel" href="#">Inhoud</c-card>').render()
    assert "<nldd-card" in html
    assert 'href="#"' in html
    assert 'slot="header"' in html  # title in the header slot
    assert "Titel" in html and "Inhoud" in html
    assert "rvo-card" not in html


# ── alert ──────────────────────────────────────────────────────────────────────


def test_alert_rvo():
    html = _env("rvo").from_string('<c-alert type="warning" heading="Let op">Body</c-alert>').render()
    assert "rvo-alert" in html and "nldd-banner" not in html


@pytest.mark.parametrize(
    "type_,variant",
    [("info", "accent"), ("success", "success"), ("warning", "warning"), ("error", "critical")],
)
def test_alert_nldd_variant_mapping(type_, variant):
    html = _env("nldd").from_string(f'<c-alert type="{type_}" heading="H">Body</c-alert>').render()
    assert "<nldd-banner" in html
    assert f'variant="{variant}"' in html
    assert 'text="H"' in html
    assert "Body" in html

"""Icon-name validation (debug mode): an icon that resolves to no icon in an
active theme's set renders as a blank box. This catches typos and one-theme-only
icons — the jinja-roos-style diagnostic. Validated against icons.json (semantic
aliases + each theme's real icon set)."""

from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import ComponentError, setup_components

PKG = Path(__file__).resolve().parent.parent / "src" / "lord_of_the_components"
NLDD = str(Path(__file__).resolve().parents[2] / "packages" / "lotc-nldd" / "src" / "lotc_nldd" / "templates")
RVO = str(Path(__file__).resolve().parents[2] / "packages" / "lotc-rvo" / "src" / "lotc_rvo" / "templates")


def _env(themes, debug=True):
    env = Environment(loader=FileSystemLoader([str(PKG / "templates"), NLDD, RVO]), autoescape=True)
    setup_components(env, design_systems=themes, registry_path=str(PKG / "registry.json"), debug=debug)
    return env


@pytest.mark.parametrize("icon", ["house", "apartment-building", "home"])  # nldd-native, nldd-raw, semantic alias
def test_valid_icon_passes(icon):
    _env(["nldd"]).from_string(f'<c-icon icon="{icon}"/>').render()  # no raise


def test_typo_errors_with_suggestion():
    with pytest.raises(ComponentError) as exc:
        _env(["nldd"]).from_string('<c-icon icon="huos"/>').render()
    assert "Unknown icon 'huos'" in str(exc.value) and "blank box" in str(exc.value)


def test_one_theme_only_icon_flagged_under_other_theme():
    # "accessibility" is NLDD-only (no alias, no RVO icon) -> blue box under RVO.
    with pytest.raises(ComponentError, match="Unknown icon 'accessibility'"):
        _env(["rvo"]).from_string('<c-icon icon="accessibility"/>').render()
    # a real RVO icon renders fine under RVO
    _env(["rvo"]).from_string('<c-icon icon="home"/>').render()


def test_show_icon_position_is_not_validated_as_a_name():
    # show-icon is a before/after/no position (enum), not an icon name.
    _env(["nldd"]).from_string('<c-button label="X" icon="house" show-icon="before"/>').render()


def test_not_validated_outside_debug():
    _env(["nldd"], debug=False).from_string('<c-icon icon="huos"/>').render()  # no raise


# ── the alias table itself ──────────────────────────────────────────────────

def _icons():
    import json

    return json.loads((PKG / "icons.json").read_text(encoding="utf-8"))


def test_every_alias_points_at_an_icon_the_theme_ships():
    """An alias to a name that does not exist renders an empty box, silently.

    That is how `folder-stack` behaved for a while: icons.json mapped it to
    `folder-on-folder`, which the bundle did not ship, so the icon came out
    blank while every gate stayed green (reported by RIG-Cluster). The usage
    check above only fires in debug mode and only for names a template actually
    writes; this checks the table itself.
    """
    icons = _icons()
    missing = []
    for semantic, per_theme in icons["aliases"].items():
        for theme, name in per_theme.items():
            if name not in set(icons["sets"][theme]):
                missing.append(f"{semantic} -> {theme}:{name}")
    assert not missing, f"aliases pointing at icons that are not shipped: {missing}"


def test_the_alias_gate_would_see_a_dangling_target():
    """Negative control: the shape `folder-stack` had must be caught."""
    icons = _icons()
    assert "folder-on-folder" in set(icons["sets"]["nldd"])  # healed in 0.8.83
    assert "not-a-real-icon" not in set(icons["sets"]["nldd"])


def test_the_generated_icon_set_matches_the_bundle_we_ship():
    """icons.json is generated from node_modules; the bundle is built from it too.

    Regenerate one without rebuilding the other and they drift — the same trap
    the CSS asset manifest had. Spot-check against the vendored bundle so the
    two cannot silently disagree about which icons exist.
    """
    bundle = (
        PKG.parents[2]
        / "packages/lotc-nldd/src/lotc_nldd/static/lotc/nldd/dist/nldd.js"
    )
    if not bundle.exists():  # pragma: no cover - only when the bundle is absent
        pytest.skip("vendored NLDD bundle not built")
    text = bundle.read_text(encoding="utf-8", errors="ignore")
    names = _icons()["sets"]["nldd"]
    absent = [n for n in names if f'"{n}"' not in text and f"'{n}'" not in text]
    assert not absent[:5] and len(absent) == 0, (
        f"{len(absent)} icons in icons.json are not in the shipped bundle "
        f"(first few: {absent[:5]}) — regenerate both"
    )

"""Icon-name validation (debug mode): an icon that resolves to no icon in an
active theme's set renders as a blank box. This catches typos and one-theme-only
icons — the jinja-roos-style diagnostic. Validated against icons.json (semantic
aliases + each theme's real icon set)."""

import re
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
    # Three spellings, because the bundle is minified: a drawn icon is a quoted
    # map key, and a friendly name whose spelling is identifier-safe loses its
    # quotes entirely (`download:"arrow-down-in-bucket"`).
    present = re.compile(
        r"""["'](?:%s)["']|(?<![\w-])(?:%s)\s*:"""
        % ("|".join(map(re.escape, names)), "|".join(map(re.escape, names)))
    )
    found = {m.group(0).strip("\"':").strip() for m in present.finditer(text)}
    absent = [n for n in names if n not in found]
    assert not absent[:5] and len(absent) == 0, (
        f"{len(absent)} icons in icons.json are not in the shipped bundle "
        f"(first few: {absent[:5]}) — regenerate both"
    )


def test_nldd_own_friendly_names_are_valid():
    """NLDD ships a friendly-name layer of its own, next to the drawn icons.

    Reading only the icon registry made our vocabulary too STRICT: 315 names
    that <nldd-icon> draws perfectly were rejected in debug mode, and we told an
    application (RIG-Cluster, RC-151) that its working download button was
    broken. The mirror image bit us at 0.8.80, when the list was too LOOSE and
    `folder-stack` pointed at an icon the bundle did not ship — same drift, other
    direction. Both are gone once the vocabulary comes from both files.
    """
    icons = _icons()
    nldd = set(icons["sets"]["nldd"])
    for friendly in ("download", "logout", "pause", "inbox"):
        assert friendly in nldd, f"{friendly} is an NLDD alias and must be accepted"
    # And it still draws: the name resolves through NLDD, not through our table.
    _env(["nldd"]).from_string('<c-icon icon="download"/>').render()


#: Where we knowingly draw something else than NLDD's own layer would. Each
#: entry is a visible difference, so it needs a reason — not a silent default.
DELIBERATE_DIVERGENCE = {
    # `tools` lived here until 0.8.84: NLDD had no wrench, so ours borrowed
    # `gear` and drew the same picture as `settings`. It ships a real tool glyph
    # now, and this gate is what said so — the compromise is gone, not grown.
    # RVO draws `favoriet` as a star and we have drawn a star under NLDD too
    # since long before NLDD published its own `favorite` -> heart-filled.
    # Left as-is deliberately: nothing reported it, and flipping it changes a
    # visible icon in every application that already uses the name. Revisit if
    # NLDD-native authors trip over it.
    "favorite": ("star", "heart-filled"),
}


def test_our_alias_agrees_with_nldds_own_when_both_define_it():
    """Where NLDD already resolves a name, our alias must mean the same glyph.

    `download` was mapped to square-arrow-down here while NLDD resolves it to
    arrow-down-in-bucket — the same word drawing two different pictures
    depending on which layer got there first.
    """
    import re as _re

    aliases_js = (
        PKG.parents[2]
        / "node_modules/@nldd/design-system/dist/components/content/icon/icon-aliases.js"
    )
    if not aliases_js.exists():  # pragma: no cover - only without node_modules
        pytest.skip("@nldd/design-system not installed")
    theirs = dict(_re.findall(r"['\"]([a-z0-9-]+)['\"]\s*:\s*['\"]([a-z0-9-]+)['\"]", aliases_js.read_text()))
    disagree = {
        name: (alias["nldd"], theirs[name])
        for name, alias in _icons()["aliases"].items()
        if name in theirs and alias["nldd"] != theirs[name] and alias["nldd"] != name
    }
    assert disagree == DELIBERATE_DIVERGENCE, (
        f"our alias and NLDD's own point at different icons: {disagree}. Either "
        "match theirs, or record the divergence with its reason."
    )

"""c-secret-field — a masked-secret display component (NLDD impl)."""

from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components


def _render(design_systems, src, missing="error"):
    env = Environment(autoescape=True, loader=FileSystemLoader([]))
    setup_components(env, design_systems=design_systems, on_missing_component=missing)
    return " ".join(env.from_string(src).render().split())


SRC = '<c-secret-field value="sk-abc123" mask-length="8" show-copy/>'


def test_secret_field_nldd_renders_masked_with_reveal_and_copy():
    out = _render(["nldd"], SRC)
    assert "•" * 8 in out  # masked dots, length from mask-length
    assert 'data-value="sk-abc123"' in out  # value client-side only
    assert 'name="eye"' in out  # reveal toggle
    assert 'name="clipboard"' in out  # copy button (show-copy)
    assert 'data-lotc-component="secret-field"' in out


def test_secret_field_copy_button_omitted_without_show_copy():
    out = _render(["nldd"], '<c-secret-field value="x" mask-length="4"/>')
    assert 'name="clipboard"' not in out
    assert 'name="eye"' in out


def test_secret_field_has_no_rvo_impl_yet():
    # RVO not implemented (NLDD-fidelity requested); should defer to on_missing.
    out = _render(["rvo"], SRC, missing="placeholder")
    assert "lotc-unimplemented" in out


def test_secret_field_revealed_shows_value_and_drops_the_eye():
    # `revealed` = a copyable NON-secret (public key, project name): the value is
    # shown in plain text and the reveal-eye is gone; the copy button stays.
    out = _render(["nldd"], '<c-secret-field value="age1-public-xyz" revealed show-copy/>')
    import re

    code = re.search(r"<code[^>]*>(.*?)</code>", out).group(1).strip()
    assert code == "age1-public-xyz"  # plain value, not mask dots
    assert "•" not in code
    assert 'data-act="reveal"' not in out  # no reveal-eye
    assert 'name="eye"' not in out
    assert 'data-act="copy"' in out  # clipboard still present

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

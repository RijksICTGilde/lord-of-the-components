"""NLDD theme pilot tests (plan v7 F6).

Renders the 6 pilot components under theme="nldd" and asserts the web-component
structure. These are separate from the RVO tests (which pin RVO class names) —
NLDD is a different design system (Lit web components, no CSS-class API).
"""

from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components

PACKAGE_DIR = Path(__file__).resolve().parent.parent.parent / "src" / "lord_of_the_components"
TEMPLATES_DIR = PACKAGE_DIR / "templates"
REGISTRY_JSON = PACKAGE_DIR / "registry.json"


@pytest.fixture
def render():
    env = Environment(loader=FileSystemLoader([str(TEMPLATES_DIR)]), autoescape=True)
    setup_components(env, registry_path=str(REGISTRY_JSON), theme="nldd")

    def _r(source: str, **ctx: object) -> str:
        return env.from_string(source).render(**ctx)

    return _r


def test_button_maps_to_nldd_button(render):
    html = render('<c-button type="primary" size="md" label="Save"/>')
    assert "<nldd-button" in html
    assert 'variant="primary"' in html
    assert 'size="md"' in html
    assert 'text="Save"' in html  # label via the text attribute, not content
    assert "</nldd-button>" in html


def test_button_escapes_label(render):
    html = render('<c-button label="<script>"/>')
    assert "<script>" not in html
    assert "&lt;script&gt;" in html


def test_button_disabled(render):
    assert " disabled" in render("<c-button disabled/>")


def test_heading_maps_to_nldd_title_with_slotted_h(render):
    html = render('<c-heading type="h2">Title</c-heading>')
    assert '<nldd-title' in html and 'size="2"' in html
    assert "<h2>Title</h2>" in html


def test_heading_visual_size_decoupled_from_level(render):
    # An explicit `size` sets the visual scale independent of the semantic level:
    # a real <h1> rendered at nldd-title size 2 (as bg.rijks.app does).
    html = render('<c-heading type="h1" size="2">Begane Grond</c-heading>')
    assert 'size="2"' in html and "<h1>Begane Grond</h1>" in html
    assert 'size="1"' not in html  # the level-derived size is overridden


def test_paragraph_uses_nldd_rich_text(render):
    # NLDD renders body copy through nldd-rich-text (typography + title-flush
    # spacing), with the text in a slotted <p> — matching the design system.
    html = render("<c-paragraph>Body</c-paragraph>")
    assert "<nldd-rich-text" in html and "<p>Body</p>" in html


def test_icon_maps_to_nldd_icon(render):
    html = render('<c-icon icon="home" size="md"/>')
    assert "<nldd-icon" in html
    assert 'name="house"' in html  # home -> house (semantic alias)


def test_link_maps_to_nldd_link(render):
    html = render('<c-link href="/x" label="Go"/>')
    assert "<nldd-link" in html
    assert 'href="/x"' in html
    assert 'text="Go"' in html


def test_layout_flow_maps_to_nldd_container(render):
    """The gap is TRANSLATED, not passed through.

    This test used to assert `gap="md"` reached the browser, pinning the bug: the
    t-shirt scale is the layout layer's, while nldd-container speaks PaddingSize
    ('0' | '2' | ... | '96'). An unknown value there resolves to `normal`, so
    every one of those gaps was no gap at all — silently.
    """
    html = render('<c-layout-flow gap="md"><c-paragraph>x</c-paragraph></c-layout-flow>')
    assert "<nldd-container" in html
    assert 'gap="16"' in html  # 1rem at a 16px root
    assert 'gap="md"' not in html


def test_no_utrecht_classes_in_nldd(render):
    # NLDD must not leak RVO/Utrecht CSS classes.
    html = render('<c-button type="primary" label="Save"/>')
    assert "utrecht-" not in html
    assert "rvo-" not in html

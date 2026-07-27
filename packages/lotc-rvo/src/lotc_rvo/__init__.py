"""RVO design-system package for Lord of the Components.

Registered with core via the ``lord_of_the_components.design_systems`` entry
point. Ships the RVO Python renderers plus the RVO-specific Jinja templates for
its jinja-backend components; the shared macros and the system layer live in core.
"""

from pathlib import Path

from lord_of_the_components.design_system import DesignSystem

_HERE = Path(__file__).resolve().parent

# The RVO webpack bundle, served from /static/lotc/dist/. RVO components are pure
# CSS (no runtime JS needed to render), so only stylesheets are declared here.
_CSS = tuple(
    f"/static/lotc/dist/{p}"
    for p in (
        "lotc.css",
        "@nl-rvo/assets/fonts/index.css",
        "@nl-rvo/assets/icons/index.css",
        "@nl-rvo/assets/images/index.css",
        "@nl-rvo/design-tokens/index.css",
        "@nl-rvo/component-library-css/index.css",
        "@nl-rvo/css-button/index.css",
    )
)

#: Discovered by core; see setup_components(design_systems=["rvo"]).
DESIGN_SYSTEM = DesignSystem(
    name="rvo",
    renderers_module="lotc_rvo.renderers",
    templates_path=_HERE / "templates",
    # Root for the /static/lotc/... URL space (holds the webpack CSS bundle).
    static_path=_HERE / "static",
    css_urls=_CSS,
)

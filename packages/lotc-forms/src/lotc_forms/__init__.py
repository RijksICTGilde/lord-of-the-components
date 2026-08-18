"""lotc-forms — an opt-in CAPABILITY SET of form-field components.

A labelled form field (label + help text + error text + the input, wired together
with correct ARIA) is universal to every form application, and every design system
has its own opinion on how that frame looks — NLDD ships real `nldd-form-field*`
components, RVO its `rvo-form-field` markup. That makes the field wrapper a
per-theme component, not something each consumer should re-glue by hand (a macro
carrying `rvo-` classes is theme-locked for the frame, defeating the theme swap).

So the field wrappers live here as an opt-in set that renders per active theme.
The value they guarantee, identically across themes, is the ARIA wiring: label
`for`/`id`, help + error linked via `aria-describedby` (NLDD: `error-message-ids`
/ `input-id`), and `aria-invalid` on error. Activate LAST, after the visual theme:

    setup_components(env, design_systems=["lotc-layout", "nldd", "lotc-forms"])
    setup_components(env, design_systems=["rvo", "lotc-forms"])

Only then do <c-text-input-field>/<c-select-field>/… resolve. The set owns its
component defs (registry.json fragment) + templates; each template branches on the
active theme (`lotc_theme`) to emit that theme's native field markup.
"""

from pathlib import Path

from lord_of_the_components.design_system import DesignSystem

_HERE = Path(__file__).resolve().parent

DESIGN_SYSTEM = DesignSystem(
    name="lotc-forms",
    renderers_module="lotc_forms.renderers",
    templates_path=_HERE / "templates",
    static_path=_HERE / "static",
    registry_path=_HERE / "registry.json",
    # A thin stylesheet: it only styles the cross-theme bits the field frame adds
    # (the NLDD file-input fallback badge, group spacing). The heavy lifting is the
    # active theme's own CSS (roos / NLDD web components).
    css_urls=("/static/lotc/forms/forms.css",),
    # The copy button and the select value-setter, once per page instead of an
    # inline <script> per field (which also ruled out a CSP without
    # 'unsafe-inline'). Both delegate from the document, so a field that arrives
    # by htmx swap needs no re-initialisation.
    js_urls=("/static/lotc/forms/forms.js",),
)

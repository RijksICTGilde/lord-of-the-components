"""BGNLDD theme: mix-and-match with NLDD.

BGNLDD is a separate theme layer that owns Begane Grond's app components
(c-metric, c-sidenav, …), absent from NLDD proper. A page declares both; NLDD
renders the primitives, BGNLDD its own components, each routed by owner theme.
Requires the lotc-bgnldd package to be installed (editable).
"""

from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components

PKG = Path(__file__).resolve().parent.parent / "src" / "lord_of_the_components"


@pytest.fixture
def render():
    env = Environment(loader=FileSystemLoader([str(PKG / "templates")]), autoescape=True)
    setup_components(
        env, design_systems=["nldd", "bgnldd"], registry_path=str(PKG / "registry.json")
    )
    return lambda s: env.from_string(s).render()


def test_metric_is_a_global_component_rendered_by_bgnldd(render):
    # c-metric is a global (core) component; BGNLDD provides its NLDD impl.
    html = render('<c-metric icon="apartment-building" value="5" label="Datacenters"/>')
    assert 'class="lotc-metric-link"' in html
    assert "lotc-metric-value" in html and ">5<" in html


def test_metric_composes_nldd_primitives(render):
    # BGNLDD markup wraps real NLDD components (card/container) and reuses the
    # NLDD icon renderer (semantic name -> nldd icon name).
    html = render('<c-metric icon="apartment-building" value="5" label="Datacenters" sub="4 operationeel"/>')
    assert "<nldd-card" in html
    assert '<nldd-container' in html and 'padding="20"' in html
    assert '<nldd-icon' in html and 'name="apartment-building"' in html


def test_sidenav_active_state(render):
    html = render('<c-sidenav><c-sidenav-item icon="house" label="Overzicht" href="/" active/></c-sidenav>')
    assert 'class="lotc-sidenav"' in html
    assert "lotc-active" in html and 'aria-current="page"' in html


def test_mix_and_match_resolves_per_component(render):
    # Same page: c-card -> NLDD (nldd-card), c-metric -> BGNLDD's impl (lotc-metric).
    html = render('<c-card>x</c-card><c-metric value="1" label="L"/>')
    assert "<nldd-card" in html  # NLDD primitive
    assert "lotc-metric-link" in html  # global component, BGNLDD impl


def test_header_utility_menu(render):
    # c-header renders its children inside the nav bar; a utility menu (c-menu
    # type="bar", placed via slot="utility") lands in the top-nav utility slot.
    html = render(
        '<c-header text="BG" link="/">'
        '<c-menu type="bar" slot="utility"><c-menu-item label="Zoeken" icon="search"/>'
        '<c-menu-item label="Nieuw" icon="plus" expandable/></c-menu></c-header>'
    )
    assert "<nldd-top-navigation-bar" in html
    assert '<nldd-menu-bar slot="utility"' in html
    assert '<nldd-menu-bar-item text="Zoeken" icon="search"' in html
    assert "expandable" in html  # the "Nieuw" item
    assert "expandable" in html  # the "Nieuw" item


def test_section_head_uses_nldd_title(render):
    # Section titles render via the real nldd-title (not a hand-styled span), so
    # they match the design system's title typography.
    html = render('<c-section-head title="De lagen" icon="timer"/>')
    assert '<nldd-title size="4"><h2' in html and "De lagen" in html


def test_layer_and_activity_render(render):
    layer = render('<c-layer icon="rectangle-stack" title="Applicaties" count="123 apps" sub="Wat.."/>')
    assert 'class="lotc-layer"' in layer and "lotc-layer-title" in layer and "lotc-layer-go" in layer
    act = render('<c-activity><c-activity-item icon="plus" actor="Anne" action="deed" res="r" at="now"/></c-activity>')
    assert 'class="lotc-activity"' in act and "lotc-activity-actor" in act and "lotc-activity-res" in act


def test_design_system_assets_global_emits_the_declared_bundles():
    # A page declaring nldd loads its web-components bundle via this global.
    env = Environment(loader=FileSystemLoader([str(PKG / "templates")]), autoescape=True)
    setup_components(env, design_systems=["nldd", "bgnldd"], registry_path=str(PKG / "registry.json"))
    html = env.from_string("{{ get_design_system_assets() }}").render()
    assert 'src="/static/lotc/nldd/dist/nldd.js"' in html  # NLDD web components


def test_cpage_loads_declared_bundles_and_app_css(render):
    # <c-page> renders the full document, loads NLDD's bundle, and the global
    # app-component styles (theme-agnostic, in core — always loaded).
    html = render('<c-page title="Overzicht" design-systems="nldd bgnldd"><p>x</p></c-page>')
    assert "<!DOCTYPE html>" in html
    assert 'src="/static/lotc/nldd/dist/nldd.js"' in html  # NLDD web components (JS module)
    assert 'href="/static/lotc/nldd/dist/css/reset.css"' in html  # NLDD base CSS
    assert 'href="/static/lotc/app-components.css"' in html  # global app-component CSS
    assert "<p>x</p>" in html


def test_identity_card_renders(render):
    # The /zelf profile header: avatar initials + name, tag content, and an aside.
    html = render(
        '<c-identity name="Anne Schuth" initials="AS" handle="@anne:rijk.chat"'
        ' aside-tag="Escalatie-piket" aside-tag-type="warning" aside-sub="achter Fatima"'
        ' aside-label="Piketrooster" aside-href="/on-call"><c-tag type="info">Engineer</c-tag>'
        "</c-identity>"
    )
    assert 'class="lotc-identity"' in html
    assert "lotc-avatar" in html and ">AS<" in html
    assert "Anne Schuth" in html and "@anne:rijk.chat" in html
    assert "lotc-identity-aside" in html and "Escalatie-piket" in html


def test_action_row_tone(render):
    # An action row carries a left-border tone and holds a right-aligned action.
    html = render(
        '<c-action icon="lock-closed" title="Roteer secret" sub="Verloopt" tone="warning">'
        '<c-button type="primary" label="Roteren"/></c-action>'
    )
    assert "lotc-action--warning" in html
    assert "lotc-action-title" in html and "Roteer secret" in html
    assert "<nldd-button" in html  # the action button, an NLDD primitive


def test_detail_list_and_items(render):
    html = render(
        '<c-detail-list id="wp-0001" icon="business-suitcase" href="/wp">'
        '<c-detail-item label="Hardware" value="Rijkslaptop"/>'
        '<c-detail-item label="Encryptie" value="volledig"/></c-detail-list>'
    )
    assert 'class="lotc-detail-list"' in html
    assert "lotc-detail-id" in html and "wp-0001" in html
    assert html.count("lotc-detail-label") == 2
    assert "Hardware" in html and "volledig" in html


def test_notification_feed(render):
    html = render(
        "<c-notification><c-notification-item icon=\"exclamation-triangle\" title=\"Latency\">"
        '<c-tag type="error">Incident</c-tag> system</c-notification-item></c-notification>'
    )
    assert 'class="lotc-notifications"' in html
    assert 'class="lotc-notification"' in html and "Latency" in html
    assert "lotc-notification-meta" in html and "Incident" in html


def test_section_link_chip(render):
    html = render('<c-section-link icon="person" label="Mijn profiel" href="/me"/>')
    assert 'class="lotc-section-link"' in html
    assert 'href="/me"' in html and "Mijn profiel" in html
    assert "lotc-section-link-go" in html  # trailing chevron


def test_breadcrumbs_has_nldd_impl(render):
    # c-breadcrumbs is a global component; NLDD provides a real impl
    # (nldd-breadcrumbs), so /zelf's breadcrumb resolves under nldd+bgnldd.
    html = render(
        '<c-breadcrumbs><c-breadcrumbs-item label="Home" href="/"/>'
        '<c-breadcrumbs-item label="Mijn overzicht"/></c-breadcrumbs>'
    )
    assert "<nldd-breadcrumbs" in html
    assert '<nldd-breadcrumbs-item text="Home" href="/"' in html
    assert '<nldd-breadcrumbs-item text="Mijn overzicht"' in html


def test_zelf_page_fixture_renders_fully():
    # The full /zelf ("Mijn overzicht") recreation renders end-to-end under
    # nldd+bgnldd with every app component resolving (no missing-impl error).
    env = Environment(loader=FileSystemLoader([str(PKG / "templates")]), autoescape=True)
    setup_components(
        env, design_systems=["nldd", "bgnldd"], registry_path=str(PKG / "registry.json")
    )
    fixture = Path(__file__).resolve().parents[2] / "tests" / "visual" / "fixtures" / "zelf.html"
    html = env.from_string(fixture.read_text(encoding="utf-8")).render()
    assert "<!DOCTYPE html>" in html and "Welkom, Anne" in html
    assert "lotc-identity" in html  # profile card
    assert html.count("lotc-metric-link") == 4  # four metrics
    assert "lotc-detail-list" in html and "lotc-notifications" in html
    assert "lotc-section-link" in html and "<nldd-breadcrumbs" in html
    assert "not implemented" not in html  # no placeholder gaps


def test_catalog_card_renders(render):
    # The /apps catalog card: icon + title/subtitle + status tag, a tag row,
    # and a maturity + open footer.
    html = render(
        '<c-catalog-card icon="rectangle-stack" title="Paspoortaanvraag" subtitle="Burgerzaken"'
        ' status="ok" status-type="success" maturity="goud" open-label="Open" href="/apps/x">'
        '<c-tag type="default">service</c-tag><c-tag type="info">Rust</c-tag></c-catalog-card>'
    )
    assert 'class="lotc-catalog"' in html
    assert "Paspoortaanvraag" in html and "Burgerzaken" in html
    assert "lotc-catalog-team" in html
    assert '<nldd-tag color="success">ok</nldd-tag>' in html  # status routed to nldd tag
    assert "lotc-medal lotc-mat-goud" in html  # gold maturity medal
    assert "lotc-catalog-open" in html and 'href="/apps/x"' in html


def test_filter_bar_and_select(render):
    html = render(
        '<c-filter-bar placeholder="Naam..." count="123 van 123" clear-label="Filters wissen">'
        '<c-filter-select label="Team" value="Alle teams"/></c-filter-bar>'
    )
    assert 'class="lotc-filterbar"' in html
    assert 'placeholder="Naam..."' in html and "lotc-filter-input" in html
    assert "lotc-filter-count" in html and "123 van 123" in html
    assert "lotc-filter-clear" in html and "Filters wissen" in html
    assert 'class="lotc-filter-field"' in html and "Alle teams" in html


def test_catalog_card_maturity_variants(render):
    for tier in ("goud", "zilver", "brons"):
        html = render(f'<c-catalog-card title="X" maturity="{tier}" open-label="Open"/>')
        assert f"lotc-mat-{tier}" in html
    # "none" (default) emits no medal
    html = render('<c-catalog-card title="X" open-label="Open"/>')
    assert "lotc-medal" not in html


def test_site_footer_renders(render):
    # Slim page footer: legal text (left) + end links (content, right) and an
    # optional centered note/action row.
    html = render(
        '<c-site-footer text="Begane Grond — demo / mock-up" note-label="Presentatie"'
        ' note="Shift + P" note-icon="eye"><c-link href="/standaarden">Toegankelijkheid'
        "</c-link></c-site-footer>"
    )
    assert 'class="lotc-site-footer"' in html and 'role="contentinfo"' in html
    assert "lotc-footer-legal" in html and "Begane Grond" in html
    assert "lotc-footer-links" in html and "Toegankelijkheid" in html
    assert "lotc-footer-note" in html and "Presentatie" in html and "Shift + P" in html
    # note-less footer emits no note row
    bare = render('<c-site-footer text="X"/>')
    assert "lotc-footer-note" not in bare


def test_site_footer_lands_in_app_shell_footer_slot(render):
    # Placed via <template slot="footer">, the footer renders full-width in the
    # app-shell's footer region.
    html = render(
        '<c-app-shell><template slot="footer"><c-site-footer text="X"/></template>body</c-app-shell>'
    )
    assert "lotc-app-shell__footer" in html and "lotc-site-footer" in html


def test_apps_page_fixture_renders_fully():
    # The full /apps ("Software-catalogus") recreation renders end-to-end under
    # nldd+bgnldd with every component resolving (no missing-impl error).
    env = Environment(loader=FileSystemLoader([str(PKG / "templates")]), autoescape=True)
    setup_components(
        env, design_systems=["nldd", "bgnldd"], registry_path=str(PKG / "registry.json")
    )
    fixture = Path(__file__).resolve().parents[2] / "tests" / "visual" / "fixtures" / "apps.html"
    html = env.from_string(fixture.read_text(encoding="utf-8")).render()
    assert "<!DOCTYPE html>" in html and "Software-catalogus" in html
    assert html.count('class="lotc-catalog"') == 9  # nine app cards
    assert "lotc-filterbar" in html and html.count("lotc-filter-field") >= 3
    assert html.count("lotc-metric-link") == 3
    assert "lotc-site-footer" in html  # page footer in the app-shell footer slot
    assert "not implemented" not in html  # no placeholder gaps


def test_app_components_are_global_and_bgnldd_is_impl_only():
    # The app components (metric, sidenav, …) are GLOBAL: their definitions live
    # in core's registry, not owned by any theme. BGNLDD is implementation-only
    # (it ships templates + CSS, no registry fragment).
    from lord_of_the_components.design_system import discover_design_systems
    from lord_of_the_components.registry import ComponentRegistry

    reg = ComponentRegistry(PKG / "registry.json")
    for name in ("metric", "sidenav", "layer", "activity", "chip", "card"):
        assert reg.has_component(name), name
        assert reg.get_component(name).theme is None  # global, no owner

    bg = discover_design_systems()["bgnldd"]
    assert bg.registry_path is None  # impl-only: no definitions of its own
    assert bg.templates_path is not None  # ships templates
    assert not bg.css_urls  # app CSS is global (core), not per-theme

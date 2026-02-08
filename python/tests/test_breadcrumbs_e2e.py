"""End-to-end tests for the breadcrumbs and breadcrumbs-item components.

Tests the full pipeline: <c-breadcrumbs>/<c-breadcrumbs-item> -> preprocessor -> Jinja2 template -> HTML output.
"""

import re


def normalize_whitespace(html: str) -> str:
    """Collapse all whitespace sequences to single spaces, strip outer whitespace."""
    return re.sub(r"\s+", " ", html).strip()


# ═══════════════════════════════════════════════════════════════════════════════
# BREADCRUMBS BASIC RENDERING
# ═══════════════════════════════════════════════════════════════════════════════


class TestBreadcrumbsBasic:
    """Test basic breadcrumbs rendering."""

    def test_renders_ol_element(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '</c-breadcrumbs>'
        )
        norm = normalize_whitespace(html)
        assert "<ol" in norm
        assert "</ol>" in norm

    def test_base_class(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '</c-breadcrumbs>'
        )
        assert "rvo-breadcrumbs" in html

    def test_data_lotc_component_attribute(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '</c-breadcrumbs>'
        )
        assert 'data-lotc-component="breadcrumbs"' in html

    def test_empty_breadcrumbs(self, render):
        html = render("<c-breadcrumbs></c-breadcrumbs>")
        norm = normalize_whitespace(html)
        assert "<ol" in norm
        assert "</ol>" in norm
        assert "rvo-breadcrumbs" in html


# ═══════════════════════════════════════════════════════════════════════════════
# BREADCRUMBS SIZE VARIANTS
# ═══════════════════════════════════════════════════════════════════════════════


class TestBreadcrumbsSize:
    """Test breadcrumbs size variants."""

    def test_default_size_sm(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '</c-breadcrumbs>'
        )
        assert "rvo-breadcrumbs--sm" in html

    def test_size_md(self, render):
        html = render(
            '<c-breadcrumbs size="md">'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '</c-breadcrumbs>'
        )
        assert "rvo-breadcrumbs--md" in html

    def test_size_lg(self, render):
        html = render(
            '<c-breadcrumbs size="lg">'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '</c-breadcrumbs>'
        )
        assert "rvo-breadcrumbs--lg" in html


# ═══════════════════════════════════════════════════════════════════════════════
# BREADCRUMBS ACCESSIBILITY
# ═══════════════════════════════════════════════════════════════════════════════


class TestBreadcrumbsAccessibility:
    """Test breadcrumbs accessibility features."""

    def test_aria_label(self, render):
        html = render(
            '<c-breadcrumbs aria-label="Broodkruimelpad">'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '</c-breadcrumbs>'
        )
        assert 'aria-label="Broodkruimelpad"' in html

    def test_no_aria_label_by_default(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '</c-breadcrumbs>'
        )
        norm = normalize_whitespace(html)
        assert 'aria-label=""' not in norm


# ═══════════════════════════════════════════════════════════════════════════════
# BREADCRUMBS CUSTOM CLASS
# ═══════════════════════════════════════════════════════════════════════════════


class TestBreadcrumbsCustomClass:
    """Test custom class handling on breadcrumbs."""

    def test_custom_class_appended(self, render):
        html = render(
            '<c-breadcrumbs class="my-breadcrumbs">'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '</c-breadcrumbs>'
        )
        assert "my-breadcrumbs" in html
        assert "rvo-breadcrumbs" in html

    def test_custom_class_does_not_replace_base(self, render):
        html = render(
            '<c-breadcrumbs class="custom">'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '</c-breadcrumbs>'
        )
        assert "rvo-breadcrumbs" in html


# ═══════════════════════════════════════════════════════════════════════════════
# BREADCRUMBS-ITEM BASIC RENDERING
# ═══════════════════════════════════════════════════════════════════════════════


class TestBreadcrumbsItemBasic:
    """Test basic breadcrumbs-item rendering."""

    def test_renders_li_element(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '</c-breadcrumbs>'
        )
        norm = normalize_whitespace(html)
        assert "<li" in norm

    def test_item_base_class(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '</c-breadcrumbs>'
        )
        assert "rvo-breadcrumbs-item" in html

    def test_data_lotc_component_breadcrumbs_item(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '</c-breadcrumbs>'
        )
        assert 'data-lotc-component="breadcrumbs-item"' in html

    def test_item_name_displayed(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Products" href="/products"/>'
            '</c-breadcrumbs>'
        )
        assert "Products" in html


# ═══════════════════════════════════════════════════════════════════════════════
# BREADCRUMBS-ITEM LINK BEHAVIOR
# ═══════════════════════════════════════════════════════════════════════════════


class TestBreadcrumbsItemLink:
    """Test breadcrumbs-item link rendering behavior."""

    def test_href_produces_anchor(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '</c-breadcrumbs>'
        )
        norm = normalize_whitespace(html)
        assert '<a href="/"' in norm

    def test_link_has_rvo_link_class(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '</c-breadcrumbs>'
        )
        assert "rvo-link" in html

    def test_link_has_no_underline_class(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '</c-breadcrumbs>'
        )
        assert "rvo-link--no-underline" in html

    def test_no_href_renders_span(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Current page"/>'
            '</c-breadcrumbs>'
        )
        norm = normalize_whitespace(html)
        assert "rvo-breadcrumb-current-page" in norm
        assert "Current page" in norm

    def test_no_href_does_not_render_anchor(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Current page"/>'
            '</c-breadcrumbs>'
        )
        norm = normalize_whitespace(html)
        # The current page item should use a span, not an anchor
        # Find the breadcrumbs-item content
        assert "rvo-breadcrumb-current-page" in norm
        # There should be no <a> for this specific item
        li_start = norm.find('data-lotc-component="breadcrumbs-item"')
        li_end = norm.find("</li>", li_start)
        item_html = norm[li_start:li_end]
        assert "<a " not in item_html


# ═══════════════════════════════════════════════════════════════════════════════
# BREADCRUMBS-ITEM DIVIDER ICON
# ═══════════════════════════════════════════════════════════════════════════════


class TestBreadcrumbsItemDivider:
    """Test breadcrumbs-item divider icon rendering."""

    def test_divider_icon_rendered(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '</c-breadcrumbs>'
        )
        assert "rvo-icon-delta-naar-rechts" in html

    def test_divider_icon_color(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '</c-breadcrumbs>'
        )
        assert "rvo-icon--hemelblauw" in html

    def test_divider_icon_size(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '</c-breadcrumbs>'
        )
        assert "rvo-icon--xs" in html

    def test_divider_icon_hidden_from_accessibility(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '</c-breadcrumbs>'
        )
        assert 'aria-hidden="true"' in html


# ═══════════════════════════════════════════════════════════════════════════════
# MULTIPLE ITEMS
# ═══════════════════════════════════════════════════════════════════════════════


class TestBreadcrumbsMultipleItems:
    """Test breadcrumbs with multiple items."""

    def test_multiple_items_rendered(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '<c-breadcrumbs-item name="Products" href="/products"/>'
            '<c-breadcrumbs-item name="Widget A"/>'
            '</c-breadcrumbs>'
        )
        assert "Home" in html
        assert "Products" in html
        assert "Widget A" in html

    def test_multiple_items_each_in_li(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '<c-breadcrumbs-item name="Products" href="/products"/>'
            '</c-breadcrumbs>'
        )
        norm = normalize_whitespace(html)
        count = norm.count("rvo-breadcrumbs-item")
        assert count >= 2

    def test_last_item_is_current_page(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '<c-breadcrumbs-item name="Current"/>'
            '</c-breadcrumbs>'
        )
        assert "rvo-breadcrumb-current-page" in html
        assert 'href="/"' in html

    def test_links_and_current_page_mixed(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '<c-breadcrumbs-item name="Products" href="/products"/>'
            '<c-breadcrumbs-item name="Details"/>'
            '</c-breadcrumbs>'
        )
        norm = normalize_whitespace(html)
        assert 'href="/"' in norm
        assert 'href="/products"' in norm
        assert "rvo-breadcrumb-current-page" in norm
        assert "Details" in norm


# ═══════════════════════════════════════════════════════════════════════════════
# BREADCRUMBS-ITEM CUSTOM CLASS
# ═══════════════════════════════════════════════════════════════════════════════


class TestBreadcrumbsItemCustomClass:
    """Test custom class handling on breadcrumbs-item."""

    def test_custom_class_on_item(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home" href="/" class="special-crumb"/>'
            '</c-breadcrumbs>'
        )
        assert "special-crumb" in html
        assert "rvo-breadcrumbs-item" in html


# ═══════════════════════════════════════════════════════════════════════════════
# HTML ATTRIBUTES PASSTHROUGH
# ═══════════════════════════════════════════════════════════════════════════════


class TestBreadcrumbsAttributes:
    """Test HTML attribute passthrough on breadcrumbs and breadcrumbs-item."""

    def test_data_attribute_on_breadcrumbs(self, render):
        html = render(
            '<c-breadcrumbs data-testid="nav-breadcrumbs">'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '</c-breadcrumbs>'
        )
        assert 'data-testid="nav-breadcrumbs"' in html

    def test_data_attribute_on_item(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home" href="/" data-id="crumb-home"/>'
            '</c-breadcrumbs>'
        )
        assert 'data-id="crumb-home"' in html


# ═══════════════════════════════════════════════════════════════════════════════
# NESTING
# ═══════════════════════════════════════════════════════════════════════════════


class TestBreadcrumbsNesting:
    """Test breadcrumbs nested in other components."""

    def test_breadcrumbs_inside_header(self, render):
        html = render(
            '<c-header text="My Site">'
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '<c-breadcrumbs-item name="Page"/>'
            '</c-breadcrumbs>'
            '</c-header>'
        )
        norm = normalize_whitespace(html)
        assert 'data-lotc-component="header"' in norm
        assert 'data-lotc-component="breadcrumbs"' in norm

    def test_breadcrumbs_inside_layout_flow(self, render):
        html = render(
            '<c-layout-flow>'
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '</c-breadcrumbs>'
            '</c-layout-flow>'
        )
        norm = normalize_whitespace(html)
        assert 'data-lotc-component="breadcrumbs"' in norm


# ═══════════════════════════════════════════════════════════════════════════════
# COMBINED SCENARIOS
# ═══════════════════════════════════════════════════════════════════════════════


class TestBreadcrumbsCombined:
    """Test combined breadcrumbs scenarios."""

    def test_full_breadcrumb_trail(self, render):
        html = render(
            '<c-breadcrumbs size="md" aria-label="Broodkruimelpad" class="site-crumbs">'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '<c-breadcrumbs-item name="Products" href="/products"/>'
            '<c-breadcrumbs-item name="Category" href="/products/cat"/>'
            '<c-breadcrumbs-item name="Widget A"/>'
            '</c-breadcrumbs>'
        )
        norm = normalize_whitespace(html)
        assert "rvo-breadcrumbs--md" in norm
        assert 'aria-label="Broodkruimelpad"' in norm
        assert "site-crumbs" in norm
        assert "Home" in norm
        assert "Products" in norm
        assert "Category" in norm
        assert "Widget A" in norm
        assert "rvo-breadcrumb-current-page" in norm

    def test_single_item_breadcrumbs(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home"/>'
            '</c-breadcrumbs>'
        )
        assert "rvo-breadcrumbs" in html
        assert "rvo-breadcrumb-current-page" in html
        assert "Home" in html

    def test_breadcrumbs_with_data_attributes(self, render):
        html = render(
            '<c-breadcrumbs data-testid="nav">'
            '<c-breadcrumbs-item name="Home" href="/" data-testid="crumb-1"/>'
            '<c-breadcrumbs-item name="About" href="/about" data-testid="crumb-2"/>'
            '</c-breadcrumbs>'
        )
        assert 'data-testid="nav"' in html
        assert 'data-testid="crumb-1"' in html
        assert 'data-testid="crumb-2"' in html

    def test_structure_ol_contains_li(self, render):
        html = render(
            '<c-breadcrumbs>'
            '<c-breadcrumbs-item name="Home" href="/"/>'
            '<c-breadcrumbs-item name="Page"/>'
            '</c-breadcrumbs>'
        )
        norm = normalize_whitespace(html)
        ol_start = norm.find("<ol")
        ol_end = norm.find("</ol>")
        li_pos = norm.find("<li")
        assert ol_start < li_pos < ol_end

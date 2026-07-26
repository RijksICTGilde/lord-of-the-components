"""End-to-end tests for the menu and menu-item components.

Tests the full pipeline: <c-menu>/<c-menu-item> -> preprocessor -> Jinja2 template -> HTML output.
"""

import re


def normalize_whitespace(html: str) -> str:
    """Collapse all whitespace sequences to single spaces, strip outer whitespace."""
    return re.sub(r"\s+", " ", html).strip()


# ═══════════════════════════════════════════════════════════════════════════════
# MENU BASIC RENDERING
# ═══════════════════════════════════════════════════════════════════════════════


class TestMenuBasic:
    """Test basic menu rendering."""

    def test_renders_div_wrapper(self, render):
        html = render('<c-menu><c-menu-item label="Home" href="/"/></c-menu>')
        norm = normalize_whitespace(html)
        assert "<div" in norm
        assert "</div>" in norm

    def test_renders_nav_element(self, render):
        html = render('<c-menu><c-menu-item label="Home" href="/"/></c-menu>')
        norm = normalize_whitespace(html)
        assert "<nav" in norm
        assert "</nav>" in norm

    def test_background_base_class(self, render):
        html = render('<c-menu><c-menu-item label="Home" href="/"/></c-menu>')
        assert "rvo-menubar__background" in html

    def test_nav_base_class(self, render):
        html = render('<c-menu><c-menu-item label="Home" href="/"/></c-menu>')
        assert "rvo-menubar" in html

    def test_data_lotc_component_attribute(self, render):
        html = render('<c-menu><c-menu-item label="Home" href="/"/></c-menu>')
        assert 'data-lotc-component="menu"' in html

    def test_list_structure(self, render):
        html = render('<c-menu><c-menu-item label="Home" href="/"/></c-menu>')
        norm = normalize_whitespace(html)
        assert "rvo-menubar__ul" in norm
        assert "rvo-menubar__list" in norm
        assert "rvo-menubar__group--flex" in norm


# ═══════════════════════════════════════════════════════════════════════════════
# MENU SIZE VARIANTS
# ═══════════════════════════════════════════════════════════════════════════════


class TestMenuSize:
    """Test menu size variants."""

    def test_default_size_md(self, render):
        html = render('<c-menu><c-menu-item label="Home" href="/"/></c-menu>')
        assert "rvo-menubar--md" in html

    def test_size_sm(self, render):
        html = render('<c-menu size="sm"><c-menu-item label="Home" href="/"/></c-menu>')
        assert "rvo-menubar--sm" in html

    def test_size_lg(self, render):
        html = render('<c-menu size="lg"><c-menu-item label="Home" href="/"/></c-menu>')
        assert "rvo-menubar--lg" in html


# ═══════════════════════════════════════════════════════════════════════════════
# MENU DIRECTION
# ═══════════════════════════════════════════════════════════════════════════════


class TestMenuDirection:
    """Test menu direction variants (horizontal/vertical)."""

    def test_default_horizontal(self, render):
        html = render('<c-menu><c-menu-item label="Home" href="/"/></c-menu>')
        norm = normalize_whitespace(html)
        # Horizontal: no --vertical modifiers
        assert "rvo-menubar__list--vertical" not in norm
        assert "rvo-menubar__group--vertical" not in norm

    def test_vertical_direction(self, render):
        html = render('<c-menu type="vertical"><c-menu-item label="Home" href="/"/></c-menu>')
        assert "rvo-menubar__list--vertical" in html
        assert "rvo-menubar__group--vertical" in html


# ═══════════════════════════════════════════════════════════════════════════════
# MENU ACCESSIBILITY
# ═══════════════════════════════════════════════════════════════════════════════


class TestMenuAccessibility:
    """Test menu accessibility features."""

    def test_aria_label(self, render):
        html = render('<c-menu aria-label="Hoofdnavigatie"><c-menu-item label="Home" href="/"/></c-menu>')
        assert 'aria-label="Hoofdnavigatie"' in html

    def test_no_aria_label_by_default(self, render):
        html = render('<c-menu><c-menu-item label="Home" href="/"/></c-menu>')
        # Should NOT have an empty aria-label attribute on the nav
        norm = normalize_whitespace(html)
        assert 'aria-label=""' not in norm


# ═══════════════════════════════════════════════════════════════════════════════
# MENU CUSTOM CLASS
# ═══════════════════════════════════════════════════════════════════════════════


class TestMenuCustomClass:
    """Test custom class handling on menu."""

    def test_custom_class_appended(self, render):
        html = render('<c-menu class="my-nav"><c-menu-item label="Home" href="/"/></c-menu>')
        assert "my-nav" in html
        assert "rvo-menubar__background" in html

    def test_custom_class_does_not_replace_base(self, render):
        html = render('<c-menu class="custom"><c-menu-item label="Home" href="/"/></c-menu>')
        assert "rvo-menubar__background" in html


# ═══════════════════════════════════════════════════════════════════════════════
# MENU-ITEM BASIC RENDERING
# ═══════════════════════════════════════════════════════════════════════════════


class TestMenuItemBasic:
    """Test basic menu-item rendering."""

    def test_renders_li_element(self, render):
        html = render('<c-menu><c-menu-item label="Home" href="/"/></c-menu>')
        norm = normalize_whitespace(html)
        assert "<li" in norm

    def test_item_base_class(self, render):
        html = render('<c-menu><c-menu-item label="Home" href="/"/></c-menu>')
        assert "rvo-menubar__item" in html

    def test_data_lotc_component_menu_item(self, render):
        html = render('<c-menu><c-menu-item label="Home" href="/"/></c-menu>')
        assert 'data-lotc-component="menu-item"' in html

    def test_renders_link_with_href(self, render):
        html = render('<c-menu><c-menu-item label="Home" href="/"/></c-menu>')
        norm = normalize_whitespace(html)
        assert '<a href="/"' in norm
        assert "Home" in norm

    def test_link_classes(self, render):
        html = render('<c-menu><c-menu-item label="Home" href="/"/></c-menu>')
        norm = normalize_whitespace(html)
        assert "rvo-link" in norm
        assert "rvo-menubar__link" in norm

    def test_item_name_displayed(self, render):
        html = render('<c-menu><c-menu-item label="Products" href="/products"/></c-menu>')
        assert "Products" in html


# ═══════════════════════════════════════════════════════════════════════════════
# MENU-ITEM LINK BEHAVIOR
# ═══════════════════════════════════════════════════════════════════════════════


class TestMenuItemLink:
    """Test menu-item link rendering behavior."""

    def test_href_produces_anchor(self, render):
        html = render('<c-menu><c-menu-item label="About" href="/about"/></c-menu>')
        norm = normalize_whitespace(html)
        assert '<a href="/about"' in norm

    def test_target_attribute(self, render):
        html = render('<c-menu><c-menu-item label="External" href="https://example.com" target="_blank"/></c-menu>')
        assert 'target="_blank"' in html

    def test_no_href_renders_span(self, render):
        html = render('<c-menu><c-menu-item label="Label"/></c-menu>')
        norm = normalize_whitespace(html)
        assert "<span" in norm
        assert "rvo-menubar__link" in norm


# ═══════════════════════════════════════════════════════════════════════════════
# MENU-ITEM ACTIVE STATE
# ═══════════════════════════════════════════════════════════════════════════════


class TestMenuItemActive:
    """Test menu-item active state."""

    def test_active_item_class(self, render):
        html = render('<c-menu><c-menu-item label="Home" href="/" active/></c-menu>')
        assert "rvo-menubar__item--active" in html

    def test_active_link_class(self, render):
        html = render('<c-menu><c-menu-item label="Home" href="/" active/></c-menu>')
        assert "rvo-link--active" in html

    def test_inactive_no_active_classes(self, render):
        html = render('<c-menu><c-menu-item label="Home" href="/"/></c-menu>')
        assert "rvo-menubar__item--active" not in html
        assert "rvo-link--active" not in html


# ═══════════════════════════════════════════════════════════════════════════════
# MENU-ITEM ICON
# ═══════════════════════════════════════════════════════════════════════════════


class TestMenuItemIcon:
    """Test menu-item icon rendering."""

    def test_icon_rendered(self, render):
        html = render('<c-menu><c-menu-item label="Home" href="/" icon="home"/></c-menu>')
        assert "rvo-icon-home" in html

    def test_icon_classes(self, render):
        html = render('<c-menu><c-menu-item label="Home" href="/" icon="home"/></c-menu>')
        assert "utrecht-icon" in html
        assert "rvo-icon" in html
        assert "rvo-icon--md" in html

    def test_icon_before_label(self, render):
        html = render('<c-menu><c-menu-item label="Home" href="/" icon="home"/></c-menu>')
        assert "rvo-menubar__icon--before" in html

    def test_no_icon_by_default(self, render):
        html = render('<c-menu><c-menu-item label="Home" href="/"/></c-menu>')
        assert "rvo-icon-" not in html


# ═══════════════════════════════════════════════════════════════════════════════
# MENU-ITEM SUBMENU (CHILDREN)
# ═══════════════════════════════════════════════════════════════════════════════


class TestMenuItemSubmenu:
    """Test menu-item with nested children (submenu)."""

    def test_submenu_renders_dropdown(self, render):
        html = render('''<c-menu>
            <c-menu-item label="Products">
                <c-menu-item label="Widget A" href="/products/a"/>
                <c-menu-item label="Widget B" href="/products/b"/>
            </c-menu-item>
        </c-menu>''')
        assert "rvo-menubar__dropdown" in html

    def test_submenu_uses_button(self, render):
        html = render('''<c-menu>
            <c-menu-item label="Products">
                <c-menu-item label="Widget A" href="/products/a"/>
            </c-menu-item>
        </c-menu>''')
        norm = normalize_whitespace(html)
        assert '<button class="rvo-link rvo-menubar__link"' in norm

    def test_submenu_button_type(self, render):
        html = render('''<c-menu>
            <c-menu-item label="Products">
                <c-menu-item label="Widget A" href="/products/a"/>
            </c-menu-item>
        </c-menu>''')
        norm = normalize_whitespace(html)
        assert 'type="button"' in norm

    def test_submenu_aria_expanded(self, render):
        html = render('''<c-menu>
            <c-menu-item label="Products">
                <c-menu-item label="Widget A" href="/products/a"/>
            </c-menu-item>
        </c-menu>''')
        assert 'aria-expanded="false"' in html

    def test_submenu_list(self, render):
        html = render('''<c-menu>
            <c-menu-item label="Products">
                <c-menu-item label="Widget A" href="/products/a"/>
            </c-menu-item>
        </c-menu>''')
        assert "rvo-menubar__submenu" in html

    def test_submenu_items_are_links(self, render):
        html = render('''<c-menu>
            <c-menu-item label="Products">
                <c-menu-item label="Widget A" href="/products/a"/>
                <c-menu-item label="Widget B" href="/products/b"/>
            </c-menu-item>
        </c-menu>''')
        norm = normalize_whitespace(html)
        assert 'href="/products/a"' in norm
        assert 'href="/products/b"' in norm
        assert "Widget A" in norm
        assert "Widget B" in norm

    def test_submenu_parent_displays_name(self, render):
        html = render('''<c-menu>
            <c-menu-item label="Products">
                <c-menu-item label="Widget A" href="/products/a"/>
            </c-menu-item>
        </c-menu>''')
        assert "Products" in html


# ═══════════════════════════════════════════════════════════════════════════════
# MULTIPLE ITEMS
# ═══════════════════════════════════════════════════════════════════════════════


class TestMenuMultipleItems:
    """Test menu with multiple items."""

    def test_multiple_items_rendered(self, render):
        html = render('''<c-menu>
            <c-menu-item label="Home" href="/"/>
            <c-menu-item label="About" href="/about"/>
            <c-menu-item label="Contact" href="/contact"/>
        </c-menu>''')
        assert "Home" in html
        assert "About" in html
        assert "Contact" in html

    def test_multiple_items_each_in_li(self, render):
        html = render('''<c-menu>
            <c-menu-item label="Home" href="/"/>
            <c-menu-item label="About" href="/about"/>
        </c-menu>''')
        norm = normalize_whitespace(html)
        # Should have multiple rvo-menubar__item occurrences
        count = norm.count("rvo-menubar__item")
        assert count >= 2

    def test_mixed_active_and_inactive(self, render):
        html = render('''<c-menu>
            <c-menu-item label="Home" href="/" active/>
            <c-menu-item label="About" href="/about"/>
        </c-menu>''')
        assert "rvo-link--active" in html
        # Only one active class
        norm = normalize_whitespace(html)
        assert norm.count("rvo-link--active") == 1


# ═══════════════════════════════════════════════════════════════════════════════
# MENU-ITEM CUSTOM CLASS
# ═══════════════════════════════════════════════════════════════════════════════


class TestMenuItemCustomClass:
    """Test custom class handling on menu-item."""

    def test_custom_class_on_item(self, render):
        html = render('<c-menu><c-menu-item label="Home" href="/" class="special-item"/></c-menu>')
        assert "special-item" in html
        assert "rvo-menubar__item" in html


# ═══════════════════════════════════════════════════════════════════════════════
# HTML ATTRIBUTES PASSTHROUGH
# ═══════════════════════════════════════════════════════════════════════════════


class TestMenuAttributes:
    """Test HTML attribute passthrough on menu and menu-item."""

    def test_data_attribute_on_menu(self, render):
        html = render('<c-menu data-testid="main-nav"><c-menu-item label="Home" href="/"/></c-menu>')
        assert 'data-testid="main-nav"' in html

    def test_data_attribute_on_item(self, render):
        html = render('<c-menu><c-menu-item label="Home" href="/" data-id="nav-home"/></c-menu>')
        assert 'data-id="nav-home"' in html


# ═══════════════════════════════════════════════════════════════════════════════
# NESTING
# ═══════════════════════════════════════════════════════════════════════════════


class TestMenuNesting:
    """Test menu nested in other components."""

    def test_menu_inside_header(self, render):
        html = render('''<c-header text="My Site">
            <c-menu>
                <c-menu-item label="Home" href="/"/>
                <c-menu-item label="About" href="/about"/>
            </c-menu>
        </c-header>''')
        norm = normalize_whitespace(html)
        assert 'data-lotc-component="header"' in norm
        assert 'data-lotc-component="menu"' in norm
        assert "rvo-menubar" in norm

    def test_menu_inside_layout_flow(self, render):
        html = render('''<c-layout-flow>
            <c-menu>
                <c-menu-item label="Home" href="/"/>
            </c-menu>
        </c-layout-flow>''')
        norm = normalize_whitespace(html)
        assert 'data-lotc-component="menu"' in norm


# ═══════════════════════════════════════════════════════════════════════════════
# COMBINED SCENARIOS
# ═══════════════════════════════════════════════════════════════════════════════


class TestMenuCombined:
    """Test combined menu scenarios."""

    def test_vertical_menu_with_icons(self, render):
        html = render('''<c-menu type="vertical" size="lg">
            <c-menu-item label="Home" href="/" icon="home" active/>
            <c-menu-item label="Settings" href="/settings" icon="instellingen"/>
        </c-menu>''')
        assert "rvo-menubar__list--vertical" in html
        assert "rvo-menubar--lg" in html
        assert "rvo-icon-home" in html
        assert "rvo-icon-instellingen" in html
        assert "rvo-link--active" in html

    def test_menu_with_submenu_and_regular_items(self, render):
        html = render('''<c-menu>
            <c-menu-item label="Home" href="/"/>
            <c-menu-item label="Products">
                <c-menu-item label="Widget A" href="/products/a"/>
                <c-menu-item label="Widget B" href="/products/b"/>
            </c-menu-item>
            <c-menu-item label="Contact" href="/contact"/>
        </c-menu>''')
        norm = normalize_whitespace(html)
        assert "Home" in norm
        assert "Products" in norm
        assert "Widget A" in norm
        assert "Widget B" in norm
        assert "Contact" in norm
        assert "rvo-menubar__dropdown" in norm
        assert "rvo-menubar__submenu" in norm

    def test_full_featured_menu(self, render):
        html = render('''<c-menu size="sm" aria-label="Hoofdnavigatie" class="site-nav">
            <c-menu-item label="Home" href="/" icon="home" active/>
            <c-menu-item label="Over ons" href="/about"/>
            <c-menu-item label="Diensten">
                <c-menu-item label="Advies" href="/services/advies"/>
                <c-menu-item label="Ondersteuning" href="/services/support"/>
            </c-menu-item>
            <c-menu-item label="Contact" href="/contact"/>
        </c-menu>''')
        norm = normalize_whitespace(html)
        assert "rvo-menubar--sm" in norm
        assert 'aria-label="Hoofdnavigatie"' in norm
        assert "site-nav" in norm
        assert "rvo-icon-home" in norm
        assert "rvo-link--active" in norm
        assert "rvo-menubar__dropdown" in norm
        assert "Advies" in norm
        assert "Ondersteuning" in norm

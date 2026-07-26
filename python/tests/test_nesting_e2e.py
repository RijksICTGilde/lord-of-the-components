"""Integration tests for nested component rendering.

Verifies that components can be nested inside each other and produce
correct HTML output through the full pipeline (preprocessor → Jinja2 → HTML).
"""

from bs4 import BeautifulSoup


class TestLayoutFlowWithCardAndButton:
    """Test the key nesting scenario: layout-flow > card > button."""

    TEMPLATE = (
        '<c-layout-flow gap="lg">'
        '<c-card title="Test">'
        '<c-button label="Click"/>'
        "</c-card>"
        "</c-layout-flow>"
    )

    def test_outer_layout_flow_rendered(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        layout = soup.find("div", attrs={"data-lotc-component": "layout-flow"})
        assert layout is not None

    def test_layout_flow_has_gap_class(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        layout = soup.find("div", attrs={"data-lotc-component": "layout-flow"})
        assert "rvo-layout-gap--lg" in layout["class"]

    def test_card_nested_inside_layout_flow(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        layout = soup.find("div", attrs={"data-lotc-component": "layout-flow"})
        card = layout.find("div", attrs={"data-lotc-component": "card"})
        assert card is not None

    def test_card_has_title(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        card = soup.find("div", attrs={"data-lotc-component": "card"})
        h3 = card.find("h3")
        assert h3 is not None
        assert "Test" in h3.get_text()

    def test_button_nested_inside_card(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        card = soup.find("div", attrs={"data-lotc-component": "card"})
        button = card.find("button", attrs={"data-lotc-component": "button"})
        assert button is not None

    def test_button_has_correct_label(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        button = soup.find("button", attrs={"data-lotc-component": "button"})
        assert "Click" in button.get_text()

    def test_three_level_nesting_structure(self, render):
        """Verify the full three-level DOM hierarchy."""
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        layout = soup.find("div", attrs={"data-lotc-component": "layout-flow"})
        card = layout.find("div", attrs={"data-lotc-component": "card"})
        button = card.find("button", attrs={"data-lotc-component": "button"})
        # All three levels present in correct parent-child order
        assert layout is not None
        assert card is not None
        assert button is not None


class TestHeadingInsideCard:
    """Test heading component nested inside a card."""

    TEMPLATE = (
        '<c-card title="Card Title">'
        '<c-heading type="h2" label="Section Title"/>'
        "</c-card>"
    )

    def test_card_rendered(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        card = soup.find("div", attrs={"data-lotc-component": "card"})
        assert card is not None

    def test_heading_nested_inside_card_content(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        card = soup.find("div", attrs={"data-lotc-component": "card"})
        heading = card.find("h2", attrs={"data-lotc-component": "heading"})
        assert heading is not None

    def test_heading_has_correct_class(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        heading = soup.find("h2", attrs={"data-lotc-component": "heading"})
        assert "utrecht-heading-2" in heading["class"]

    def test_heading_has_correct_text(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        heading = soup.find("h2", attrs={"data-lotc-component": "heading"})
        assert "Section Title" in heading.get_text()

    def test_card_title_and_heading_both_present(self, render):
        """Card's own h3 title and the nested h2 heading should both appear."""
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        card = soup.find("div", attrs={"data-lotc-component": "card"})
        h3 = card.find("h3")
        h2 = card.find("h2")
        assert h3 is not None
        assert "Card Title" in h3.get_text()
        assert h2 is not None
        assert "Section Title" in h2.get_text()


class TestIconInsideButton:
    """Test icon component used as content inside a button."""

    TEMPLATE = (
        '<c-button>'
        '<c-icon icon="search" size="sm"/> Search'
        "</c-button>"
    )

    def test_button_rendered(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        button = soup.find("button", attrs={"data-lotc-component": "button"})
        assert button is not None

    def test_icon_nested_inside_button(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        button = soup.find("button", attrs={"data-lotc-component": "button"})
        icon = button.find("span", attrs={"data-lotc-component": "icon"})
        assert icon is not None

    def test_icon_has_correct_classes(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        icon = soup.find("span", attrs={"data-lotc-component": "icon"})
        assert "rvo-icon" in icon["class"]
        assert "rvo-icon-zoek" in icon["class"]  # search -> zoek (semantic alias)
        assert "rvo-icon--sm" in icon["class"]

    def test_button_contains_search_text(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        button = soup.find("button", attrs={"data-lotc-component": "button"})
        assert "Search" in button.get_text()


class TestMultipleCardsInLayoutFlow:
    """Test multiple sibling cards inside a layout-flow."""

    TEMPLATE = (
        '<c-layout-flow gap="md">'
        '<c-card title="Card One"><p>Content one</p></c-card>'
        '<c-card title="Card Two"><p>Content two</p></c-card>'
        "</c-layout-flow>"
    )

    def test_layout_flow_rendered(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        layout = soup.find("div", attrs={"data-lotc-component": "layout-flow"})
        assert layout is not None

    def test_two_cards_inside_layout(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        layout = soup.find("div", attrs={"data-lotc-component": "layout-flow"})
        cards = layout.find_all("div", attrs={"data-lotc-component": "card"})
        assert len(cards) == 2

    def test_first_card_has_correct_title(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        cards = soup.find_all("div", attrs={"data-lotc-component": "card"})
        h3 = cards[0].find("h3")
        assert "Card One" in h3.get_text()

    def test_second_card_has_correct_title(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        cards = soup.find_all("div", attrs={"data-lotc-component": "card"})
        h3 = cards[1].find("h3")
        assert "Card Two" in h3.get_text()

    def test_cards_preserve_their_content(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        cards = soup.find_all("div", attrs={"data-lotc-component": "card"})
        assert "Content one" in cards[0].get_text()
        assert "Content two" in cards[1].get_text()


class TestComponentsWithHTMLSiblings:
    """Test components mixed with plain HTML content."""

    TEMPLATE = (
        '<c-layout-flow gap="sm">'
        "<p>Some plain text</p>"
        '<c-button label="Action"/>'
        "<p>More plain text</p>"
        "</c-layout-flow>"
    )

    def test_plain_text_preserved(self, render):
        html = render(self.TEMPLATE)
        assert "Some plain text" in html
        assert "More plain text" in html

    def test_button_rendered_between_html(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        button = soup.find("button", attrs={"data-lotc-component": "button"})
        assert button is not None
        assert "Action" in button.get_text()


class TestDeeplyNestedStructure:
    """Test a realistic page structure with multiple nesting levels."""

    TEMPLATE = (
        '<c-layout-flow gap="lg" size="md">'
        '<c-heading type="h1" label="Page Title"/>'
        '<c-layout-flow gap="md" row>'
        '<c-card title="Feature A">'
        '<c-button type="primary" label="Learn More"/>'
        "</c-card>"
        '<c-card title="Feature B">'
        '<c-button type="secondary" label="Details"/>'
        "</c-card>"
        "</c-layout-flow>"
        "</c-layout-flow>"
    )

    def test_outer_layout_has_correct_size(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        layouts = soup.find_all("div", attrs={"data-lotc-component": "layout-flow"})
        outer = layouts[0]
        assert "rvo-max-width-layout--md" in outer["class"]

    def test_inner_layout_is_row(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        layouts = soup.find_all("div", attrs={"data-lotc-component": "layout-flow"})
        # The inner layout-flow is nested inside the outer one
        inner = layouts[1]
        assert "rvo-layout-row" in inner["class"]

    def test_h1_heading_at_top_level(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        h1 = soup.find("h1", attrs={"data-lotc-component": "heading"})
        assert h1 is not None
        assert "Page Title" in h1.get_text()

    def test_two_cards_in_inner_layout(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        layouts = soup.find_all("div", attrs={"data-lotc-component": "layout-flow"})
        inner = layouts[1]
        cards = inner.find_all("div", attrs={"data-lotc-component": "card"})
        assert len(cards) == 2

    def test_primary_button_in_first_card(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        cards = soup.find_all("div", attrs={"data-lotc-component": "card"})
        button = cards[0].find("button", attrs={"data-lotc-component": "button"})
        assert button is not None
        assert "Learn More" in button.get_text()
        assert "utrecht-button--primary-action" in button["class"]

    def test_secondary_button_in_second_card(self, render):
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        cards = soup.find_all("div", attrs={"data-lotc-component": "card"})
        button = cards[1].find("button", attrs={"data-lotc-component": "button"})
        assert button is not None
        assert "Details" in button.get_text()
        assert "utrecht-button--secondary-action" in button["class"]

    def test_four_level_nesting_depth(self, render):
        """Verify layout-flow > layout-flow > card > button nesting."""
        html = render(self.TEMPLATE)
        soup = BeautifulSoup(html, "html.parser")
        outer = soup.find("div", attrs={"data-lotc-component": "layout-flow"})
        inner = outer.find("div", attrs={"data-lotc-component": "layout-flow"})
        card = inner.find("div", attrs={"data-lotc-component": "card"})
        button = card.find("button", attrs={"data-lotc-component": "button"})
        assert outer is not None
        assert inner is not None
        assert card is not None
        assert button is not None

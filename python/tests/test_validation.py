"""Unit tests for validation.py — DataValidator, schemas, and expression validation.

Covers DataValidator class methods, custom schema support, convenience functions,
expression validation edge cases, and validate_dynamic_attribute.
"""

from lord_of_the_components.validation import (
    ColumnSchema,
    DataValidator,
    ItemSchema,
    StepSchema,
    ValidationError,
    ValidationResult,
    validate_columns,
    validate_dynamic_attribute,
    validate_expression,
    validate_generic_color,
    validate_generic_size,
    validate_items,
    validate_steps,
)

# ---------------------------------------------------------------------------
# ValidationResult
# ---------------------------------------------------------------------------


class TestValidationResult:
    def test_success_result(self):
        result = ValidationResult.success()
        assert result.valid is True
        assert result.errors == []

    def test_failure_result(self):
        errors = [ValidationError(path="x", message="bad", value=None)]
        result = ValidationResult.failure(errors)
        assert result.valid is False
        assert len(result.errors) == 1

    def test_failure_preserves_error_details(self):
        err = ValidationError(path="items[0]", message="Missing key", value={"a": 1})
        result = ValidationResult.failure([err])
        assert result.errors[0].path == "items[0]"
        assert result.errors[0].message == "Missing key"
        assert result.errors[0].value == {"a": 1}


# ---------------------------------------------------------------------------
# DataValidator.validate_items
# ---------------------------------------------------------------------------


class TestValidateItems:
    def test_valid_items_default_schema(self):
        items = [{"label": "A"}, {"label": "B", "value": "b"}]
        v = DataValidator()
        result = v.validate_items(items)
        assert result.valid is True

    def test_not_a_list(self):
        v = DataValidator()
        result = v.validate_items("string")
        assert result.valid is False
        assert "list" in result.errors[0].message.lower()

    def test_not_a_list_dict(self):
        v = DataValidator()
        result = v.validate_items({"label": "x"})
        assert result.valid is False

    def test_item_not_dict(self):
        v = DataValidator()
        result = v.validate_items(["not a dict"])
        assert result.valid is False
        assert "dict" in result.errors[0].message.lower()

    def test_missing_label_key(self):
        v = DataValidator()
        result = v.validate_items([{"value": "no-label"}])
        assert result.valid is False
        assert "label" in result.errors[0].message

    def test_custom_label_key(self):
        schema = ItemSchema(label_key="title")
        v = DataValidator()
        # Missing "title" key
        result = v.validate_items([{"label": "wrong key"}], schema=schema)
        assert result.valid is False
        assert "title" in result.errors[0].message

    def test_custom_label_key_valid(self):
        schema = ItemSchema(label_key="title")
        v = DataValidator()
        result = v.validate_items([{"title": "correct"}], schema=schema)
        assert result.valid is True

    def test_custom_required_keys(self):
        schema = ItemSchema(required_keys=["id", "name"])
        v = DataValidator()
        result = v.validate_items([{"id": 1}], schema=schema)
        assert result.valid is False
        assert "name" in result.errors[0].message

    def test_custom_required_keys_all_present(self):
        schema = ItemSchema(required_keys=["id", "name"])
        v = DataValidator()
        result = v.validate_items([{"id": 1, "name": "A"}], schema=schema)
        assert result.valid is True

    def test_multiple_invalid_items(self):
        v = DataValidator()
        result = v.validate_items([
            {"value": "no-label"},
            {"value": "also-no-label"},
        ])
        assert result.valid is False
        assert len(result.errors) == 2
        assert "[0]" in result.errors[0].path
        assert "[1]" in result.errors[1].path

    def test_nested_children_valid(self):
        schema = ItemSchema(children_key="children")
        v = DataValidator()
        items = [
            {
                "label": "Parent",
                "children": [
                    {"label": "Child 1"},
                    {"label": "Child 2"},
                ],
            }
        ]
        result = v.validate_items(items, schema=schema)
        assert result.valid is True

    def test_nested_children_invalid_child(self):
        schema = ItemSchema(children_key="children")
        v = DataValidator()
        items = [
            {
                "label": "Parent",
                "children": [
                    {"value": "missing-label"},
                ],
            }
        ]
        result = v.validate_items(items, schema=schema)
        assert result.valid is False
        assert "children[0]" in result.errors[0].path

    def test_nested_children_not_a_list(self):
        schema = ItemSchema(children_key="children")
        v = DataValidator()
        items = [{"label": "Parent", "children": "not a list"}]
        result = v.validate_items(items, schema=schema)
        assert result.valid is False
        assert "children" in result.errors[0].path

    def test_deeply_nested_children(self):
        schema = ItemSchema(children_key="children")
        v = DataValidator()
        items = [
            {
                "label": "L1",
                "children": [
                    {
                        "label": "L2",
                        "children": [
                            {"label": "L3"},
                        ],
                    }
                ],
            }
        ]
        result = v.validate_items(items, schema=schema)
        assert result.valid is True

    def test_empty_items_list(self):
        v = DataValidator()
        result = v.validate_items([])
        assert result.valid is True

    def test_custom_path(self):
        v = DataValidator()
        result = v.validate_items("bad", path="menu_items")
        assert result.errors[0].path == "menu_items"


# ---------------------------------------------------------------------------
# DataValidator.validate_columns
# ---------------------------------------------------------------------------


class TestValidateColumns:
    def test_valid_columns(self):
        v = DataValidator()
        result = v.validate_columns([{"key": "name", "label": "Name"}])
        assert result.valid is True

    def test_string_shorthand(self):
        v = DataValidator()
        result = v.validate_columns(["name", "age"])
        assert result.valid is True

    def test_not_a_list(self):
        v = DataValidator()
        result = v.validate_columns("not a list")
        assert result.valid is False

    def test_column_not_string_or_dict(self):
        v = DataValidator()
        result = v.validate_columns([123])
        assert result.valid is False
        assert "string or dict" in result.errors[0].message.lower()

    def test_missing_key(self):
        v = DataValidator()
        result = v.validate_columns([{"label": "Name"}])
        assert result.valid is False
        assert "key" in result.errors[0].message

    def test_custom_schema_required_keys(self):
        schema = ColumnSchema(required_keys=["id", "header"])
        v = DataValidator()
        result = v.validate_columns([{"id": "col1"}], schema=schema)
        assert result.valid is False
        assert "header" in result.errors[0].message

    def test_custom_key_key(self):
        schema = ColumnSchema(key_key="field")
        v = DataValidator()
        result = v.validate_columns([{"field": "name"}], schema=schema)
        assert result.valid is True

    def test_mixed_valid_and_invalid(self):
        v = DataValidator()
        result = v.validate_columns(["valid_string", {"label": "no key"}, {"key": "ok"}])
        assert result.valid is False
        assert len(result.errors) == 1
        assert "[1]" in result.errors[0].path

    def test_empty_columns(self):
        v = DataValidator()
        result = v.validate_columns([])
        assert result.valid is True


# ---------------------------------------------------------------------------
# DataValidator.validate_steps
# ---------------------------------------------------------------------------


class TestValidateSteps:
    def test_valid_steps(self):
        v = DataValidator()
        result = v.validate_steps([
            {"label": "Step 1", "state": "complete"},
            {"label": "Step 2", "state": "current"},
            {"label": "Step 3", "state": "pending"},
        ])
        assert result.valid is True

    def test_not_a_list(self):
        v = DataValidator()
        result = v.validate_steps(42)
        assert result.valid is False

    def test_step_not_dict(self):
        v = DataValidator()
        result = v.validate_steps(["not a dict"])
        assert result.valid is False
        assert "dict" in result.errors[0].message.lower()

    def test_missing_label(self):
        v = DataValidator()
        result = v.validate_steps([{"state": "pending"}])
        assert result.valid is False
        assert "label" in result.errors[0].message

    def test_invalid_state(self):
        v = DataValidator()
        result = v.validate_steps([{"label": "Step 1", "state": "unknown"}])
        assert result.valid is False
        assert "unknown" in result.errors[0].message
        assert "pending" in result.errors[0].message

    def test_step_without_state_is_valid(self):
        """Steps without a state key are valid (state is optional)."""
        v = DataValidator()
        result = v.validate_steps([{"label": "Step 1"}])
        assert result.valid is True

    def test_custom_valid_states(self):
        schema = StepSchema(valid_states=["todo", "done"])
        v = DataValidator()
        result = v.validate_steps([{"label": "S", "state": "pending"}], schema=schema)
        assert result.valid is False
        assert "pending" in result.errors[0].message

    def test_custom_valid_states_accepted(self):
        schema = StepSchema(valid_states=["todo", "done"])
        v = DataValidator()
        result = v.validate_steps([{"label": "S", "state": "done"}], schema=schema)
        assert result.valid is True

    def test_custom_label_key(self):
        schema = StepSchema(label_key="title")
        v = DataValidator()
        result = v.validate_steps([{"title": "S1"}], schema=schema)
        assert result.valid is True

    def test_custom_state_key(self):
        schema = StepSchema(state_key="status", valid_states=["active", "inactive"])
        v = DataValidator()
        result = v.validate_steps([{"label": "S", "status": "active"}], schema=schema)
        assert result.valid is True

    def test_error_path_for_invalid_state(self):
        v = DataValidator()
        result = v.validate_steps([{"label": "S", "state": "bad"}])
        assert "state" in result.errors[0].path

    def test_empty_steps(self):
        v = DataValidator()
        result = v.validate_steps([])
        assert result.valid is True


# ---------------------------------------------------------------------------
# DataValidator.validate_type
# ---------------------------------------------------------------------------


class TestValidateType:
    def test_valid_single_type(self):
        v = DataValidator()
        result = v.validate_type("hello", str)
        assert result.valid is True

    def test_invalid_single_type(self):
        v = DataValidator()
        result = v.validate_type(42, str)
        assert result.valid is False
        assert "str" in result.errors[0].message

    def test_valid_tuple_of_types(self):
        v = DataValidator()
        result = v.validate_type(42, (str, int))
        assert result.valid is True

    def test_invalid_tuple_of_types(self):
        v = DataValidator()
        result = v.validate_type([], (str, int))
        assert result.valid is False
        assert "str" in result.errors[0].message
        assert "int" in result.errors[0].message

    def test_custom_path(self):
        v = DataValidator()
        result = v.validate_type("x", int, path="my_field")
        assert result.errors[0].path == "my_field"

    def test_none_value(self):
        v = DataValidator()
        result = v.validate_type(None, str)
        assert result.valid is False

    def test_bool_is_int(self):
        """In Python, bool is a subclass of int, so True passes int check."""
        v = DataValidator()
        result = v.validate_type(True, int)
        assert result.valid is True

    def test_dict_type(self):
        v = DataValidator()
        result = v.validate_type({"a": 1}, dict)
        assert result.valid is True

    def test_list_type(self):
        v = DataValidator()
        result = v.validate_type([1, 2], list)
        assert result.valid is True


# ---------------------------------------------------------------------------
# Convenience functions
# ---------------------------------------------------------------------------


class TestConvenienceFunctions:
    def test_validate_items_with_custom_keys(self):
        result = validate_items(
            [{"title": "A", "id": "1"}],
            label_key="title",
            value_key="id",
        )
        assert result.valid is True

    def test_validate_items_with_children_key(self):
        result = validate_items(
            [{"label": "A", "sub": [{"label": "B"}]}],
            children_key="sub",
        )
        assert result.valid is True

    def test_validate_columns_with_custom_keys(self):
        result = validate_columns(
            [{"field": "name"}],
            key_key="field",
        )
        assert result.valid is True

    def test_validate_steps_with_custom_keys(self):
        result = validate_steps(
            [{"title": "S1", "status": "done"}],
            label_key="title",
            state_key="status",
            valid_states=["done", "pending"],
        )
        assert result.valid is True

    def test_validate_generic_size_all_valid(self):
        for size in ["xs", "sm", "md", "lg", "xl"]:
            result = validate_generic_size(size)
            assert result.valid is True, f"Size '{size}' should be valid"

    def test_validate_generic_size_invalid(self):
        result = validate_generic_size("xxl")
        assert result.valid is False
        assert "xxl" in result.errors[0].message

    def test_validate_generic_color_all_valid(self):
        for color in ["primary", "secondary", "success", "warning", "error", "info"]:
            result = validate_generic_color(color)
            assert result.valid is True, f"Color '{color}' should be valid"

    def test_validate_generic_color_invalid(self):
        result = validate_generic_color("purple")
        assert result.valid is False
        assert "purple" in result.errors[0].message


# ---------------------------------------------------------------------------
# Expression validation
# ---------------------------------------------------------------------------


class TestExpressionValidation:
    def test_valid_simple_expression(self):
        is_valid, error = validate_expression("x")
        assert is_valid is True
        assert error is None

    def test_valid_attribute_access(self):
        is_valid, _ = validate_expression("item.label")
        assert is_valid is True

    def test_valid_function_call(self):
        is_valid, _ = validate_expression("get_items()")
        assert is_valid is True

    def test_valid_comparison(self):
        is_valid, _ = validate_expression("x > 0 and y < 10")
        assert is_valid is True

    def test_valid_list_literal(self):
        is_valid, _ = validate_expression("[1, 2, 3]")
        assert is_valid is True

    def test_valid_dict_literal(self):
        is_valid, _ = validate_expression("{'a': 1}")
        assert is_valid is True

    def test_valid_ternary(self):
        is_valid, _ = validate_expression("'yes' if flag else 'no'")
        assert is_valid is True

    def test_empty_expression(self):
        is_valid, error = validate_expression("")
        assert is_valid is False
        assert "empty" in error.message.lower()

    def test_whitespace_only_expression(self):
        is_valid, error = validate_expression("   ")
        assert is_valid is False
        assert "empty" in error.message.lower()

    def test_none_expression(self):
        is_valid, error = validate_expression(None)
        assert is_valid is False

    def test_jinja_delimiters_rejected(self):
        is_valid, error = validate_expression("{{ x }}")
        assert is_valid is False
        assert error.suggestion is not None
        assert "{{" not in error.suggestion

    def test_jinja_control_tags_rejected(self):
        is_valid, error = validate_expression("{% if x %}")
        assert is_valid is False
        assert "control" in error.message.lower() or "{%" in error.message

    def test_unclosed_parenthesis(self):
        is_valid, error = validate_expression("func(a, b")
        assert is_valid is False
        assert error.position is not None

    def test_unclosed_bracket(self):
        is_valid, error = validate_expression("items[0")
        assert is_valid is False

    def test_unclosed_brace(self):
        is_valid, error = validate_expression("{'key': 1")
        assert is_valid is False

    def test_unmatched_closing_bracket(self):
        is_valid, error = validate_expression("x)")
        assert is_valid is False
        assert "unmatched" in error.message.lower()

    def test_mismatched_brackets(self):
        is_valid, error = validate_expression("items[0)")
        assert is_valid is False
        assert "mismatch" in error.message.lower() or "expected" in error.message.lower()

    def test_unclosed_string_single_quote(self):
        is_valid, error = validate_expression("'unclosed")
        assert is_valid is False

    def test_unclosed_string_double_quote(self):
        is_valid, error = validate_expression('"unclosed')
        assert is_valid is False

    def test_brackets_inside_strings_ignored(self):
        """Brackets within strings should not affect balance check."""
        is_valid, _ = validate_expression("'hello (world'")
        assert is_valid is True

    def test_suggest_and_for_double_ampersand(self):
        is_valid, error = validate_expression("a && b")
        assert is_valid is False
        assert error.suggestion == "a and b"

    def test_suggest_or_for_double_pipe(self):
        is_valid, error = validate_expression("a || b")
        assert is_valid is False
        assert error.suggestion == "a or b"

    def test_suggest_not_for_exclamation(self):
        is_valid, error = validate_expression("!flag")
        assert is_valid is False
        assert error.suggestion == "not flag"

    def test_suggest_double_equals(self):
        """Single = in expression should suggest == if that fixes it."""
        is_valid, error = validate_expression("x = 5")
        assert is_valid is False
        assert error.suggestion == "x == 5"

    def test_valid_expression_with_and_or_not(self):
        is_valid, _ = validate_expression("a and b or not c")
        assert is_valid is True

    def test_syntax_error_no_suggestion(self):
        """Some syntax errors won't have a clear suggestion."""
        is_valid, error = validate_expression("def x():")
        assert is_valid is False
        # May or may not have a suggestion, but should have a message
        assert error.message


# ---------------------------------------------------------------------------
# validate_dynamic_attribute
# ---------------------------------------------------------------------------


class TestValidateDynamicAttribute:
    def test_valid_dynamic_attribute(self):
        is_valid, error = validate_dynamic_attribute(":variant", "item.variant")
        assert is_valid is True
        assert error is None

    def test_valid_without_colon_prefix(self):
        is_valid, error = validate_dynamic_attribute("variant", "item.variant")
        assert is_valid is True

    def test_invalid_expression_includes_attr_name(self):
        is_valid, error = validate_dynamic_attribute(":disabled", "{{ bad }}")
        assert is_valid is False
        assert ":disabled" in error.expression

    def test_empty_expression(self):
        is_valid, error = validate_dynamic_attribute(":items", "")
        assert is_valid is False
        assert ":items" in error.expression

    def test_colon_stripped_in_expression_display(self):
        is_valid, error = validate_dynamic_attribute("::extra", "bad syntax {{")
        assert is_valid is False
        # Colon prefix should be stripped, showing clean attr name
        assert ":extra" in error.expression


# ---------------------------------------------------------------------------
# DataValidator reuse (validator reset between calls)
# ---------------------------------------------------------------------------


class TestValidatorReuse:
    def test_errors_reset_between_calls(self):
        """Calling validate_* methods should reset errors from previous calls."""
        v = DataValidator()

        # First call produces errors
        result1 = v.validate_items("not a list")
        assert not result1.valid

        # Second call should start fresh
        result2 = v.validate_items([{"label": "OK"}])
        assert result2.valid is True
        assert result2.errors == []

    def test_different_methods_reset(self):
        """Switching between validate methods should reset errors."""
        v = DataValidator()

        result1 = v.validate_items("bad")
        assert not result1.valid

        result2 = v.validate_columns(["valid"])
        assert result2.valid is True

    def test_type_after_items_resets(self):
        v = DataValidator()

        result1 = v.validate_items(42)
        assert not result1.valid

        result2 = v.validate_type("hello", str)
        assert result2.valid is True

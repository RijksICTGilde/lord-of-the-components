# ruff: noqa
# mypy: ignore-errors
"""Generated Python renderers — DO NOT EDIT.

Produced by core/src/generators/python/index.ts from the ElementNode IR.
"""

from lord_of_the_components.runtime import (
    Markup,
    esc,
    merge_class,
    render_extra,
    render_utility,
)

def button(*, type='primary', size='md', icon='', show_icon='no', color='wit', full_width=False, label='', aria_label='', disabled=False, loading=False, active=False, html_type='button', href='', target='', content=None, _extra=None, _class=''):
    parts = []
    cls0 = ''
    cls0 = merge_class(cls0, _class)
    parts.append('<nldd-button')
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="button"')
    if type:
        parts.append(' variant="')
        parts.append(esc(type))
        parts.append('"')
    if size:
        parts.append(' size="')
        parts.append(esc(size))
        parts.append('"')
    if label:
        parts.append(' text="')
        parts.append(esc(label))
        parts.append('"')
    if html_type:
        parts.append(' type="')
        parts.append(esc(html_type))
        parts.append('"')
    if disabled:
        parts.append(' disabled')
    if href:
        parts.append(' href="')
        parts.append(esc(href))
        parts.append('"')
    if target:
        parts.append(' target="')
        parts.append(esc(target))
        parts.append('"')
    parts.append(render_extra(_extra))
    parts.append('>')
    parts.append((content or ''))
    parts.append('</nldd-button>')
    return Markup(''.join(parts))

_HEADING_SIZE_MAP = {
    'h1': '1',
    'h2': '2',
    'h3': '3',
    'h4': '4',
    'h5': '5',
    'h6': '6',
}

def heading(*, type='h1', label='', content=None, _extra=None, _class=''):
    parts = []
    cls0 = ''
    cls0 = merge_class(cls0, _class)
    parts.append('<nldd-title')
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="heading"')
    parts.append(' size="')
    parts.append(esc(_HEADING_SIZE_MAP.get(type, type)))
    parts.append('"')
    parts.append(render_extra(_extra))
    parts.append('>')
    _el0 = type or 'h1'
    parts.append('<' + _el0)
    parts.append('>')
    parts.append(((content or '') if content else esc(label)))
    parts.append('</' + _el0 + '>')
    parts.append('</nldd-title>')
    return Markup(''.join(parts))

_ICON_ICONS_MAP = {
    'home': 'house',
    'settings': 'gear',
    'notification': 'bell',
    'info': 'info-circle',
    'favorite': 'star',
    'mail': 'envelope',
    'calendar': 'calendar-event',
    'search': 'magnifier',
}

def icon(*, icon='', size='md', color='', aria_label='', content=None, _extra=None, _class=''):
    parts = []
    cls0 = ''
    cls0 = merge_class(cls0, _class)
    parts.append('<nldd-icon')
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="icon"')
    if icon:
        parts.append(' name="')
        parts.append(esc(_ICON_ICONS_MAP.get(icon, icon)))
        parts.append('"')
    if size:
        parts.append(' size="')
        parts.append(esc(size))
        parts.append('"')
    if color:
        parts.append(' color="')
        parts.append(esc(color))
        parts.append('"')
    parts.append(render_extra(_extra))
    parts.append('>')
    parts.append('</nldd-icon>')
    return Markup(''.join(parts))

def layout_flow(*, gap='md', size='lg', row=False, wrap=False, align_items='', align_content='', justify_items='', justify_content='', content=None, _extra=None, _class=''):
    parts = []
    cls0 = ''
    cls0 = merge_class(cls0, _class)
    parts.append('<nldd-container')
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="layout-flow"')
    if gap:
        parts.append(' gap="')
        parts.append(esc(gap))
        parts.append('"')
    parts.append(render_extra(_extra))
    parts.append('>')
    parts.append((content or ''))
    parts.append('</nldd-container>')
    return Markup(''.join(parts))

def link(*, label='', href='', color='hemelblauw', weight='bold', show_icon='no', icon='', icon_size='md', icon_color='', icon_aria_label='', target='', role='', hover=False, active=False, focus=False, no_underline=False, full_container_link=False, content=None, _extra=None, _class=''):
    parts = []
    cls0 = ''
    cls0 = merge_class(cls0, _class)
    parts.append('<nldd-link')
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="link"')
    if href:
        parts.append(' href="')
        parts.append(esc(href))
        parts.append('"')
    if target:
        parts.append(' target="')
        parts.append(esc(target))
        parts.append('"')
    if label:
        parts.append(' text="')
        parts.append(esc(label))
        parts.append('"')
    parts.append(render_extra(_extra))
    parts.append('>')
    parts.append((content or ''))
    parts.append('</nldd-link>')
    return Markup(''.join(parts))

def paragraph(*, label='', color='grijs-900', size='md', no_spacing=False, content=None, _extra=None, _class=''):
    parts = []
    cls0 = ''
    cls0 = merge_class(cls0, _class)
    parts.append('<p')
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="paragraph"')
    parts.append(render_extra(_extra))
    parts.append('>')
    parts.append(((content or '') if content else esc(label)))
    parts.append('</p>')
    return Markup(''.join(parts))

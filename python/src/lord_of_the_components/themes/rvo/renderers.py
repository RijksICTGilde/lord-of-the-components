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

_BUTTON_SIZE = {
    'xs': ' utrecht-button--rvo-xs',
    'sm': ' utrecht-button--rvo-sm',
    'md': ' utrecht-button--rvo-md',
}

def button(*, type='primary', size='md', icon='', show_icon='no', color='wit', full_width=False, label='', aria_label='', disabled=False, loading=False, active=False, html_type='button', href='', target='', content=None, _extra=None, _class=''):
    parts = []
    cls0 = 'utrecht-button'
    if type == 'primary':
        cls0 += ' utrecht-button--primary-action'
    if type == 'warning':
        cls0 += ' utrecht-button--primary-action'
    if type == 'secondary':
        cls0 += ' utrecht-button--secondary-action'
    if type == 'tertiary':
        cls0 += ' utrecht-button--rvo-tertiary-action'
    if type == 'quaternary':
        cls0 += ' utrecht-button--rvo-quaternary-action'
    if type in ('subtle', 'warning-subtle'):
        cls0 += ' utrecht-button--subtle'
    if type in ('warning', 'warning-subtle'):
        cls0 += ' utrecht-button--warning'
    if active:
        cls0 += ' utrecht-button--active'
    if loading:
        cls0 += ' utrecht-button--busy'
    cls0 += _BUTTON_SIZE.get(size, '')
    if full_width:
        cls0 += ' utrecht-button--rvo-full-width'
    if show_icon == 'before':
        cls0 += ' utrecht-button--icon-before'
    if show_icon == 'after':
        cls0 += ' utrecht-button--icon-after'
    cls0 = merge_class(cls0, render_utility(_extra))
    cls0 = merge_class(cls0, _class)
    parts.append('<button')
    parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="button"')
    if disabled:
        parts.append(' disabled')
    parts.append(' type="')
    parts.append(esc(html_type))
    parts.append('"')
    parts.append(render_extra(_extra))
    parts.append('>')
    if show_icon == 'before':
        cls1 = 'utrecht-icon rvo-icon'
        if icon:
            cls1 += ' rvo-icon-' + icon
        if size:
            cls1 += ' rvo-icon--' + size
        if color:
            cls1 += ' rvo-icon--' + color
        parts.append('<span')
        parts.append(' class="' + cls1 + '"')
        parts.append(' role="img"')
        parts.append(' aria-label="')
        parts.append(esc(aria_label))
        parts.append('"')
        parts.append('>')
        parts.append('</span>')
    parts.append('<span')
    parts.append('>')
    parts.append(((content or '') if content else esc(label)))
    parts.append('</span>')
    if show_icon == 'after':
        cls2 = 'utrecht-icon rvo-icon'
        if icon:
            cls2 += ' rvo-icon-' + icon
        if size:
            cls2 += ' rvo-icon--' + size
        if color:
            cls2 += ' rvo-icon--' + color
        parts.append('<span')
        parts.append(' class="' + cls2 + '"')
        parts.append(' role="img"')
        parts.append(' aria-label="')
        parts.append(esc(aria_label))
        parts.append('"')
        parts.append('>')
        parts.append('</span>')
    parts.append('</button>')
    return Markup(''.join(parts))

def heading(*, type='h1', label='', content=None, _extra=None, _class=''):
    parts = []
    _el0 = type or 'h1'
    cls0 = ''
    if type == 'h1':
        cls0 += ' utrecht-heading-1'
    if type == 'h2':
        cls0 += ' utrecht-heading-2'
    if type == 'h3':
        cls0 += ' utrecht-heading-3'
    if type == 'h4':
        cls0 += ' utrecht-heading-4'
    if type == 'h5':
        cls0 += ' utrecht-heading-5'
    if type == 'h6':
        cls0 += ' utrecht-heading-6'
    cls0 = merge_class(cls0, render_utility(_extra))
    cls0 = merge_class(cls0, _class)
    parts.append('<' + _el0)
    parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="heading"')
    parts.append(render_extra(_extra))
    parts.append('>')
    parts.append(((content or '') if content else esc(label)))
    parts.append('</' + _el0 + '>')
    return Markup(''.join(parts))

_ICON_SIZE = {
    '2xs': ' rvo-icon--2xs',
    'xs': ' rvo-icon--xs',
    'sm': ' rvo-icon--sm',
    'md': ' rvo-icon--md',
    'lg': ' rvo-icon--lg',
    'xl': ' rvo-icon--xl',
    '2xl': ' rvo-icon--2xl',
    '3xl': ' rvo-icon--3xl',
    '4xl': ' rvo-icon--4xl',
}

def icon(*, icon='', size='md', color='', aria_label='', content=None, _extra=None, _class=''):
    parts = []
    cls0 = 'utrecht-icon rvo-icon'
    if icon:
        cls0 += ' rvo-icon-' + icon
    cls0 += _ICON_SIZE.get(size, '')
    if color:
        cls0 += ' rvo-icon--' + color
    cls0 = merge_class(cls0, render_utility(_extra))
    cls0 = merge_class(cls0, _class)
    parts.append('<span')
    parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="icon"')
    parts.append(' role="img"')
    parts.append(' aria-label="')
    parts.append(esc(aria_label))
    parts.append('"')
    parts.append(render_extra(_extra))
    parts.append('>')
    parts.append('</span>')
    return Markup(''.join(parts))

_LAYOUT_FLOW_SIZE = {
    'sm': ' rvo-max-width-layout--sm',
    'md': ' rvo-max-width-layout--md',
    'lg': ' rvo-max-width-layout--lg',
}

_LAYOUT_FLOW_GAP = {
    '0': ' rvo-layout-gap--0',
    '3xs': ' rvo-layout-gap--3xs',
    '2xs': ' rvo-layout-gap--2xs',
    'xs': ' rvo-layout-gap--xs',
    'sm': ' rvo-layout-gap--sm',
    'md': ' rvo-layout-gap--md',
    'lg': ' rvo-layout-gap--lg',
    'xl': ' rvo-layout-gap--xl',
    '2xl': ' rvo-layout-gap--2xl',
    '3xl': ' rvo-layout-gap--3xl',
    '4xl': ' rvo-layout-gap--4xl',
    '5xl': ' rvo-layout-gap--5xl',
}

_LAYOUT_FLOW_ALIGN_ITEMS = {
    'start': ' rvo-layout-align-items-start',
    'center': ' rvo-layout-align-items-center',
    'end': ' rvo-layout-align-items-end',
}

_LAYOUT_FLOW_ALIGN_CONTENT = {
    'start': ' rvo-layout-align-content-start',
    'center': ' rvo-layout-align-content-center',
    'end': ' rvo-layout-align-content-end',
    'space-between': ' rvo-layout-align-content-space-between',
}

_LAYOUT_FLOW_JUSTIFY_ITEMS = {
    'start': ' rvo-layout-justify-items-start',
    'center': ' rvo-layout-justify-items-center',
    'end': ' rvo-layout-justify-items-end',
}

_LAYOUT_FLOW_JUSTIFY_CONTENT = {
    'start': ' rvo-layout-justify-content-start',
    'center': ' rvo-layout-justify-content-center',
    'end': ' rvo-layout-justify-content-end',
    'space-between': ' rvo-layout-justify-content-space-between',
}

def layout_flow(*, gap='md', size='lg', row=False, wrap=False, align_items='', align_content='', justify_items='', justify_content='', content=None, _extra=None, _class=''):
    is_column = not (row)
    parts = []
    cls0 = 'rvo-max-width-layout'
    cls0 += _LAYOUT_FLOW_SIZE.get(size, '')
    if row:
        cls0 += ' rvo-layout-row'
    if is_column:
        cls0 += ' rvo-layout-column'
    cls0 += _LAYOUT_FLOW_GAP.get(gap, '')
    if wrap:
        cls0 += ' rvo-layout--wrap'
    cls0 += _LAYOUT_FLOW_ALIGN_ITEMS.get(align_items, '')
    cls0 += _LAYOUT_FLOW_ALIGN_CONTENT.get(align_content, '')
    cls0 += _LAYOUT_FLOW_JUSTIFY_ITEMS.get(justify_items, '')
    cls0 += _LAYOUT_FLOW_JUSTIFY_CONTENT.get(justify_content, '')
    cls0 = merge_class(cls0, render_utility(_extra))
    cls0 = merge_class(cls0, _class)
    parts.append('<div')
    parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="layout-flow"')
    parts.append(render_extra(_extra))
    parts.append('>')
    parts.append((content or ''))
    parts.append('</div>')
    return Markup(''.join(parts))

def link(*, label='', href='', color='hemelblauw', weight='bold', show_icon='no', icon='', icon_size='md', icon_color='', icon_aria_label='', target='', role='', hover=False, active=False, focus=False, no_underline=False, full_container_link=False, content=None, _extra=None, _class=''):
    parts = []
    cls0 = 'rvo-link'
    if active:
        cls0 += ' rvo-link--active'
    if hover:
        cls0 += ' rvo-link--hover'
    if focus:
        cls0 += ' rvo-link--focus'
    if show_icon == 'before':
        cls0 += ' rvo-link--with-icon'
    if show_icon == 'after':
        cls0 += ' rvo-link--with-icon'
    if no_underline:
        cls0 += ' rvo-link--no-underline'
    if color == 'donkerblauw':
        cls0 += ' rvo-link--donkerblauw'
    if color == 'lintblauw':
        cls0 += ' rvo-link--lintblauw'
    if color == 'wit':
        cls0 += ' rvo-link--wit'
    if color == 'zwart':
        cls0 += ' rvo-link--zwart'
    if color == 'grijs-700':
        cls0 += ' rvo-link--grijs-700'
    if weight == 'normal':
        cls0 += ' rvo-link--normal'
    if full_container_link:
        cls0 += ' rvo-link--full-card-link'
    cls0 = merge_class(cls0, render_utility(_extra))
    cls0 = merge_class(cls0, _class)
    parts.append('<a')
    parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="link"')
    if href:
        parts.append(' href="')
        parts.append(esc(href))
        parts.append('"')
    if role:
        parts.append(' role="')
        parts.append(esc(role))
        parts.append('"')
    if target:
        parts.append(' target="')
        parts.append(esc(target))
        parts.append('"')
    parts.append(render_extra(_extra))
    parts.append('>')
    if show_icon == 'before':
        cls1 = 'utrecht-icon rvo-icon rvo-link__icon--before'
        if icon:
            cls1 += ' rvo-icon-' + icon
        if icon_size:
            cls1 += ' rvo-icon--' + icon_size
        if icon_color:
            cls1 += ' rvo-icon--' + icon_color
        parts.append('<span')
        parts.append(' class="' + cls1 + '"')
        parts.append('>')
        parts.append('</span>')
    parts.append('<span')
    parts.append('>')
    parts.append(((content or '') if content else esc(label)))
    parts.append('</span>')
    if show_icon == 'after':
        cls2 = 'utrecht-icon rvo-icon rvo-link__icon--after'
        if icon:
            cls2 += ' rvo-icon-' + icon
        if icon_size:
            cls2 += ' rvo-icon--' + icon_size
        if icon_color:
            cls2 += ' rvo-icon--' + icon_color
        parts.append('<span')
        parts.append(' class="' + cls2 + '"')
        parts.append('>')
        parts.append('</span>')
    parts.append('</a>')
    return Markup(''.join(parts))

_PARAGRAPH_COLOR = {
    'logoblauw': ' rvo-paragraph--logoblauw',
    'wit': ' rvo-paragraph--wit',
    'zwart': ' rvo-paragraph--zwart',
    'grijs-500': ' rvo-paragraph--grijs-500',
    'grijs-900': ' rvo-paragraph--grijs-900',
}

_PARAGRAPH_SIZE = {
    'sm': ' rvo-paragraph--sm',
    'md': ' rvo-paragraph--md',
    'lg': ' rvo-paragraph--lg',
}

def paragraph(*, label='', color='grijs-900', size='md', no_spacing=False, content=None, _extra=None, _class=''):
    parts = []
    cls0 = 'rvo-paragraph'
    cls0 += _PARAGRAPH_COLOR.get(color, '')
    cls0 += _PARAGRAPH_SIZE.get(size, '')
    if no_spacing:
        cls0 += ' rvo-paragraph--no-spacing'
    cls0 = merge_class(cls0, render_utility(_extra))
    cls0 = merge_class(cls0, _class)
    parts.append('<p')
    parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="paragraph"')
    parts.append(render_extra(_extra))
    parts.append('>')
    parts.append(((content or '') if content else esc(label)))
    parts.append('</p>')
    return Markup(''.join(parts))

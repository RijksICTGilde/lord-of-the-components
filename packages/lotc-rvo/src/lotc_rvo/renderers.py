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

def accordion(*, content=None, _extra=None, _class=''):
    parts = []
    cls0 = 'rvo-accordion'
    cls0 = merge_class(cls0, _class)
    parts.append('<div')
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="accordion"')
    parts.append(render_extra(_extra))
    parts.append('>')
    parts.append((content or ''))
    parts.append('</div>')
    return Markup(''.join(parts))

def accordion_item(*, title='', open=False, content=None, _extra=None, _class=''):
    parts = []
    cls0 = 'rvo-accordion__item'
    cls0 = merge_class(cls0, _class)
    parts.append('<details')
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="accordion-item"')
    if open:
        parts.append(' open')
    parts.append(render_extra(_extra))
    parts.append('>')
    cls1 = 'rvo-accordion__item-summary'
    parts.append('<summary')
    if cls1:
        parts.append(' class="' + cls1 + '"')
    parts.append('>')
    cls2 = 'rvo-accordion__item-icon'
    parts.append('<div')
    if cls2:
        parts.append(' class="' + cls2 + '"')
    parts.append('>')
    cls3 = 'utrecht-icon rvo-icon rvo-icon-delta-omlaag rvo-icon--md rvo-icon--hemelblauw rvo-accordion__item-icon--closed'
    parts.append('<span')
    if cls3:
        parts.append(' class="' + cls3 + '"')
    parts.append(' role="img"')
    parts.append(' aria-hidden="true"')
    parts.append('>')
    parts.append('</span>')
    cls4 = 'utrecht-icon rvo-icon rvo-icon-delta-omhoog rvo-icon--md rvo-icon--hemelblauw rvo-accordion__item-icon--open'
    parts.append('<span')
    if cls4:
        parts.append(' class="' + cls4 + '"')
    parts.append(' role="img"')
    parts.append(' aria-hidden="true"')
    parts.append('>')
    parts.append('</span>')
    parts.append('</div>')
    cls5 = 'rvo-accordion__item-title-container'
    parts.append('<div')
    if cls5:
        parts.append(' class="' + cls5 + '"')
    parts.append('>')
    cls6 = 'utrecht-heading-3 rvo-accordion__item-title'
    parts.append('<h3')
    if cls6:
        parts.append(' class="' + cls6 + '"')
    parts.append('>')
    parts.append(esc(title))
    parts.append('</h3>')
    parts.append('</div>')
    parts.append('</summary>')
    cls7 = 'rvo-accordion__content'
    parts.append('<div')
    if cls7:
        parts.append(' class="' + cls7 + '"')
    parts.append('>')
    parts.append((content or ''))
    parts.append('</div>')
    parts.append('</details>')
    return Markup(''.join(parts))

def badge(*, type='default', label='', content=None, _extra=None, _class=''):
    parts = []
    cls0 = 'rvo-badge'
    cls0 = merge_class(cls0, _class)
    parts.append('<span')
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="badge"')
    parts.append(render_extra(_extra))
    parts.append('>')
    parts.append(((content or '') if content else esc(label)))
    parts.append('</span>')
    return Markup(''.join(parts))

_BUTTON_SIZE = {
    'xs': ' utrecht-button--rvo-xs',
    'sm': ' utrecht-button--rvo-sm',
    'md': ' utrecht-button--rvo-md',
}

_BUTTON_COLORS_MAP = {
    'primary': 'hemelblauw',
    'primary-dark': 'donkerblauw',
    'muted': 'grijs-700',
    'inverse': 'wit',
    'hemelblauw': 'hemelblauw',
    'donkerblauw': 'donkerblauw',
    'logoblauw': 'logoblauw',
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
    if cls0:
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
            cls1 += ' rvo-icon--' + _BUTTON_COLORS_MAP.get(color, color)
        parts.append('<span')
        if cls1:
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
            cls2 += ' rvo-icon--' + _BUTTON_COLORS_MAP.get(color, color)
        parts.append('<span')
        if cls2:
            parts.append(' class="' + cls2 + '"')
        parts.append(' role="img"')
        parts.append(' aria-label="')
        parts.append(esc(aria_label))
        parts.append('"')
        parts.append('>')
        parts.append('</span>')
    parts.append('</button>')
    return Markup(''.join(parts))

def checkbox(*, name='', value='', label='', checked=False, disabled=False, required=False, content=None, _extra=None, _class=''):
    parts = []
    cls0 = 'rvo-checkbox'
    if disabled:
        cls0 += ' rvo-checkbox--disabled'
    cls0 = merge_class(cls0, _class)
    parts.append('<label')
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="checkbox"')
    parts.append(render_extra(_extra))
    parts.append('>')
    cls1 = 'rvo-checkbox__input'
    parts.append('<input')
    if cls1:
        parts.append(' class="' + cls1 + '"')
    parts.append(' type="checkbox"')
    if name:
        parts.append(' name="')
        parts.append(esc(name))
        parts.append('"')
    if value:
        parts.append(' value="')
        parts.append(esc(value))
        parts.append('"')
    if checked:
        parts.append(' checked')
    if disabled:
        parts.append(' disabled')
    if required:
        parts.append(' required')
    parts.append('>')
    parts.append('<span')
    parts.append('>')
    parts.append(esc(label))
    parts.append('</span>')
    parts.append('</label>')
    return Markup(''.join(parts))

def heading(*, type='h1', size='', label='', content=None, _extra=None, _class=''):
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
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="heading"')
    parts.append(render_extra(_extra))
    parts.append('>')
    parts.append(((content or '') if content else esc(label)))
    parts.append('</' + _el0 + '>')
    return Markup(''.join(parts))

_ICON_ICONS_MAP = {
    'home': 'home',
    'settings': 'instellingen',
    'notification': 'bel',
    'info': 'info',
    'favorite': 'favoriet',
    'mail': 'mail',
    'calendar': 'kalender',
    'search': 'zoek',
    'apartment-building': 'flat',
    'arrow-up-arrow-down': 'gegevensuitwisseling',
    'books-vertical': 'boeken-achter-elkaar',
    'brackets-ellipsis': 'computercode',
    'business-suitcase': 'koffer',
    'certificate': 'diploma-certificaat',
    'chart-x-y-axis-line': 'grafiek',
    'check-list': 'klembord-met-vinkjes-en-lijnen',
    'check-mark-circle': 'vinkje',
    'chevron-left-forward-slash-chevron-right': 'computercode',
    'clipboard': 'klembord-met-lijnen-met-kruis',
    'clipboard-rectangle': 'klembord-met-lijnen-met-kruis',
    'code': 'computercode',
    'cylinder-split': 'database',
    'database': 'database',
    'envelope': 'mail',
    'euro-sign': 'eurobiljetten',
    'exclamation-triangle': 'let-op',
    'eye': 'oog',
    'eyeglasses': 'oog',
    'face-smiling-badge-plus': 'user',
    'file-text': 'document-blanco',
    'flag': 'vlag-driehoekig',
    'folder-stack': 'map-vol-documenten',
    'gear': 'instellingen',
    'globe': 'wereldbol',
    'heart': 'hart',
    'house': 'home',
    'link': 'interne-link',
    'lock-closed': 'hangslot-dicht',
    'pencil-on-square': 'bewerken',
    'person': 'user',
    'person-2': 'personen-arm-op-schouder',
    'person-circle': 'user',
    'plus': 'plus',
    'puzzle-piece': 'puzzel',
    'rectangle-stack': 'tegelweergave',
    'shield-check-mark': 'schild-met-vinkje-erop',
    'ship-wheel': 'stuurwiel',
    'sparkles': 'ster',
    'square-on-square': 'kopieerapparaat',
    'starburst-filled': 'ster',
    'sun': 'zon',
    'tag': 'label',
    'terminal': 'computercode',
    'timer': 'klok',
}

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

_ICON_COLORS_MAP = {
    'primary': 'hemelblauw',
    'primary-dark': 'donkerblauw',
    'muted': 'grijs-700',
    'inverse': 'wit',
    'hemelblauw': 'hemelblauw',
    'donkerblauw': 'donkerblauw',
    'logoblauw': 'logoblauw',
}

def icon(*, icon='', size='md', color='', aria_label='', content=None, _extra=None, _class=''):
    parts = []
    cls0 = 'utrecht-icon rvo-icon'
    if icon:
        cls0 += ' rvo-icon-' + _ICON_ICONS_MAP.get(icon, icon)
    cls0 += _ICON_SIZE.get(size, '')
    if color:
        cls0 += ' rvo-icon--' + _ICON_COLORS_MAP.get(color, color)
    cls0 = merge_class(cls0, render_utility(_extra))
    cls0 = merge_class(cls0, _class)
    parts.append('<span')
    if cls0:
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
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="layout-flow"')
    parts.append(render_extra(_extra))
    parts.append('>')
    parts.append((content or ''))
    parts.append('</div>')
    return Markup(''.join(parts))

_LINK_COLORS_MAP = {
    'primary': 'hemelblauw',
    'primary-dark': 'donkerblauw',
    'muted': 'grijs-700',
    'inverse': 'wit',
    'hemelblauw': 'hemelblauw',
    'donkerblauw': 'donkerblauw',
    'logoblauw': 'logoblauw',
}

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
    if cls0:
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
            cls1 += ' rvo-icon--' + _LINK_COLORS_MAP.get(icon_color, icon_color)
        parts.append('<span')
        if cls1:
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
            cls2 += ' rvo-icon--' + _LINK_COLORS_MAP.get(icon_color, icon_color)
        parts.append('<span')
        if cls2:
            parts.append(' class="' + cls2 + '"')
        parts.append('>')
        parts.append('</span>')
    parts.append('</a>')
    return Markup(''.join(parts))

def option(*, value='', label='', selected=False, disabled=False, content=None, _extra=None, _class=''):
    parts = []
    cls0 = ''
    cls0 = merge_class(cls0, _class)
    parts.append('<option')
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="option"')
    if value:
        parts.append(' value="')
        parts.append(esc(value))
        parts.append('"')
    if selected:
        parts.append(' selected')
    if disabled:
        parts.append(' disabled')
    parts.append(render_extra(_extra))
    parts.append('>')
    parts.append(((content or '') if content else esc(label)))
    parts.append('</option>')
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
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="paragraph"')
    parts.append(render_extra(_extra))
    parts.append('>')
    parts.append(((content or '') if content else esc(label)))
    parts.append('</p>')
    return Markup(''.join(parts))

def radio(*, name='', value='', label='', checked=False, disabled=False, required=False, content=None, _extra=None, _class=''):
    parts = []
    cls0 = 'rvo-radio-button__label'
    cls0 = merge_class(cls0, _class)
    parts.append('<label')
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="radio"')
    parts.append(render_extra(_extra))
    parts.append('>')
    cls1 = 'rvo-radio-button'
    parts.append('<input')
    if cls1:
        parts.append(' class="' + cls1 + '"')
    parts.append(' type="radio"')
    if name:
        parts.append(' name="')
        parts.append(esc(name))
        parts.append('"')
    if value:
        parts.append(' value="')
        parts.append(esc(value))
        parts.append('"')
    if checked:
        parts.append(' checked')
    if disabled:
        parts.append(' disabled')
    if required:
        parts.append(' required')
    parts.append('>')
    parts.append('<span')
    parts.append('>')
    parts.append(esc(label))
    parts.append('</span>')
    parts.append('</label>')
    return Markup(''.join(parts))

def select(*, name='', value='', placeholder='', disabled=False, required=False, content=None, _extra=None, _class=''):
    parts = []
    cls0 = 'rvo-select-wrapper'
    cls0 = merge_class(cls0, _class)
    parts.append('<div')
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="select"')
    parts.append(render_extra(_extra))
    parts.append('>')
    cls1 = 'utrecht-select utrecht-select--html-select'
    if disabled:
        cls1 += ' utrecht-select--disabled'
    parts.append('<select')
    if cls1:
        parts.append(' class="' + cls1 + '"')
    if name:
        parts.append(' name="')
        parts.append(esc(name))
        parts.append('"')
    if disabled:
        parts.append(' disabled')
    if required:
        parts.append(' required')
    parts.append('>')
    parts.append((content or ''))
    parts.append('</select>')
    parts.append('</div>')
    return Markup(''.join(parts))

def tab(*, label='', href='', active=False, content=None, _extra=None, _class=''):
    parts = []
    cls0 = 'rvo-tabs__item'
    cls0 = merge_class(cls0, _class)
    parts.append('<li')
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="tab"')
    parts.append(render_extra(_extra))
    parts.append('>')
    cls1 = 'rvo-tabs__item-link'
    if active:
        cls1 += ' rvo-tabs__item-link--active'
    parts.append('<a')
    if cls1:
        parts.append(' class="' + cls1 + '"')
    if href:
        parts.append(' href="')
        parts.append(esc(href))
        parts.append('"')
    parts.append('>')
    parts.append(((content or '') if content else esc(label)))
    parts.append('</a>')
    parts.append('</li>')
    return Markup(''.join(parts))

def table(*, columns='', content=None, _extra=None, _class=''):
    parts = []
    cls0 = 'rvo-table--responsive'
    cls0 = merge_class(cls0, _class)
    parts.append('<div')
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="table"')
    parts.append(render_extra(_extra))
    parts.append('>')
    cls1 = 'rvo-table'
    parts.append('<table')
    if cls1:
        parts.append(' class="' + cls1 + '"')
    parts.append('>')
    parts.append((content or ''))
    parts.append('</table>')
    parts.append('</div>')
    return Markup(''.join(parts))

def table_head(*, content=None, _extra=None, _class=''):
    parts = []
    cls0 = 'rvo-table-row'
    cls0 = merge_class(cls0, _class)
    parts.append('<tr')
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="table-head"')
    parts.append(render_extra(_extra))
    parts.append('>')
    parts.append((content or ''))
    parts.append('</tr>')
    return Markup(''.join(parts))

def table_row(*, content=None, _extra=None, _class=''):
    parts = []
    cls0 = 'rvo-table-row'
    cls0 = merge_class(cls0, _class)
    parts.append('<tr')
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="table-row"')
    parts.append(render_extra(_extra))
    parts.append('>')
    parts.append((content or ''))
    parts.append('</tr>')
    return Markup(''.join(parts))

def tabs(*, aria_label='', content=None, _extra=None, _class=''):
    parts = []
    cls0 = 'rvo-tabs rvo-ul rvo-ul--no-margin rvo-ul--no-padding'
    cls0 = merge_class(cls0, _class)
    parts.append('<ul')
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="tabs"')
    parts.append(' role="tablist"')
    if aria_label:
        parts.append(' aria-label="')
        parts.append(esc(aria_label))
        parts.append('"')
    parts.append(render_extra(_extra))
    parts.append('>')
    parts.append((content or ''))
    parts.append('</ul>')
    return Markup(''.join(parts))

def tag(*, type='default', label='', content=None, _extra=None, _class=''):
    parts = []
    cls0 = 'rvo-tag'
    if type:
        cls0 += ' rvo-tag--' + type
    cls0 = merge_class(cls0, _class)
    parts.append('<div')
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="tag"')
    parts.append(render_extra(_extra))
    parts.append('>')
    parts.append(((content or '') if content else esc(label)))
    parts.append('</div>')
    return Markup(''.join(parts))

def td(*, numeric=False, content=None, _extra=None, _class=''):
    parts = []
    cls0 = 'rvo-table-cell'
    if numeric:
        cls0 += ' rvo-table-cell--numeric'
    cls0 = merge_class(cls0, _class)
    parts.append('<td')
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="td"')
    parts.append(render_extra(_extra))
    parts.append('>')
    parts.append((content or ''))
    parts.append('</td>')
    return Markup(''.join(parts))

def text_input(*, type='text', name='', value='', placeholder='', autocomplete='', disabled=False, required=False, readonly=False, content=None, _extra=None, _class=''):
    parts = []
    cls0 = 'utrecht-textbox utrecht-textbox--html-input'
    if disabled:
        cls0 += ' utrecht-textbox--disabled'
    cls0 = merge_class(cls0, _class)
    parts.append('<input')
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="text-input"')
    parts.append(' type="')
    parts.append(esc(type))
    parts.append('"')
    if name:
        parts.append(' name="')
        parts.append(esc(name))
        parts.append('"')
    if value:
        parts.append(' value="')
        parts.append(esc(value))
        parts.append('"')
    if placeholder:
        parts.append(' placeholder="')
        parts.append(esc(placeholder))
        parts.append('"')
    if autocomplete:
        parts.append(' autocomplete="')
        parts.append(esc(autocomplete))
        parts.append('"')
    if disabled:
        parts.append(' disabled')
    if required:
        parts.append(' required')
    if readonly:
        parts.append(' readonly')
    parts.append(render_extra(_extra))
    parts.append('>')
    return Markup(''.join(parts))

def textarea(*, name='', value='', placeholder='', disabled=False, required=False, readonly=False, content=None, _extra=None, _class=''):
    parts = []
    cls0 = 'utrecht-textbox utrecht-textbox--html-textarea'
    if disabled:
        cls0 += ' utrecht-textbox--disabled'
    cls0 = merge_class(cls0, _class)
    parts.append('<textarea')
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="textarea"')
    if name:
        parts.append(' name="')
        parts.append(esc(name))
        parts.append('"')
    if placeholder:
        parts.append(' placeholder="')
        parts.append(esc(placeholder))
        parts.append('"')
    if disabled:
        parts.append(' disabled')
    if required:
        parts.append(' required')
    if readonly:
        parts.append(' readonly')
    parts.append(render_extra(_extra))
    parts.append('>')
    parts.append(esc(value))
    parts.append('</textarea>')
    return Markup(''.join(parts))

def th(*, numeric=False, content=None, _extra=None, _class=''):
    parts = []
    cls0 = 'rvo-table-header'
    if numeric:
        cls0 += ' rvo-table-header--numeric'
    cls0 = merge_class(cls0, _class)
    parts.append('<th')
    if cls0:
        parts.append(' class="' + cls0 + '"')
    parts.append(' data-lotc-component="th"')
    parts.append(render_extra(_extra))
    parts.append('>')
    parts.append((content or ''))
    parts.append('</th>')
    return Markup(''.join(parts))

# LOTC — ronde 8: `:attrs` spread GESHIPT (bump 00c03fc) + je date-widget omgezet

Van: LOTC-onderhoud. Het laatste gat voor je formulierlaag is dicht.

## De spread — precies de vorm die je vroeg

`:attrs="expr"` neemt een **platte dict** `{naam: waarde}` en merget die op de control.
`None` of `''` ⇒ die entry weg (zelfde regel als `:prop="… or none"`). Dekt `hx-*`,
`data-*`, `aria-*` én gewone HTML-attributen. Gewired op alle 9 velden, beide thema's;
`hx-vals: None` en `aria-x: ''` vallen weg, de rest landt op de `<input>` (of de control
van dat veld). Getest onder RVO en NLDD.

Dus je vier macro's kunnen alle vier weg: `optional_attr`/`bool_attr` → `:prop`,
`htmx_attrs`+`extra_attrs` → één `:attrs`-dict.

## Je `date.html.j2`, omgezet (het beloofde sjabloon)

Jouw origineel had 8 voorwaardelijke attributen via macro's. Zo wordt het:

```jinja
{{ description_text(field) }}
<c-text-input-field
    id="{{ field.path|e }}"
    name="{{ field.path|e }}"
    label="{{ field.label|e }}"
    type="{{ 'datetime-local' if field.widget_type == 'datetime' else 'date' }}"
    :help="combined_helper(field)|trim or none"
    :required="field.required"
    :disabled="field.readonly"
    :value="format_value(field.value) or none"
    :error="(field.errors[0] if field.errors else none)"
    :attrs="field_attrs(field)"
/>{{ render_examples(field) }}
```

Wat er veranderde, één op één:
- `optional_attr("helperText", …)` → `:help="… or none"` (leeg ⇒ weg).
- `bool_attr("required", …)` / `bool_attr("disabled", …)` → `:required=` / `:disabled=`.
- `optional_attr("value", …)` → `:value="… or none"`.
- `optional_attr("invalid", …)` + `optional_attr("errorText", …)` → **alleen** `:error=`;
  lotc-forms leidt `aria-invalid` uit `error` af, dus de aparte `invalid` valt weg.
- `htmx_attrs(field)` + `extra_attrs(field)` → één `:attrs="field_attrs(field)"`.

`field_attrs` is aan jouw kant één helper die de twee bundels tot één dict merget:
```jinja
{% macro field_attrs(field) %}{{ (field.htmx_attrs or {}) | merge(field.attributes or {}) }}{% endmacro %}
```
Jinja heeft geen dict-merge-filter standaard; het handigst is een Python-helper
`field_attrs(field)` die `{**htmx_dict(field), **extra_dict(field)}` teruggeeft en die je
als global registreert. Dan is `:attrs="field_attrs(field)"` alles.

## Eén kanttekening: `type` op datumvelden

Jouw widget zet `type="date"`/`"datetime-local"` op `c-text-input-field`. Onze
`type`-enum daar is nu `text|email|tel|url|number|search` — `date`/`datetime-local`
zitten er (nog) niet in, dus in debug-mode geeft dat een enum-fout. Twee wegen:
  (a) Ik verbreed de `type`-enum met `date`/`datetime-local`/`time` (klein, doe ik graag).
  (b) Of gebruik `c-date-input-field` voor de datum-case (die mapt op `nldd-date-field`,
      een echte datumpicker onder NLDD) — maar die heeft geen `datetime-local`.
Zeg welke je wilt; als je de text-input-met-type-aanpak houdt, verbreed ik de enum.

## Stand van de queue

Spread ✅ (00c03fc). Volgende, in de afgesproken volgorde: **c-secret-field**, dan de
**6 icoon-aliassen + waarschuwing**, dan **c-data-list onder NLDD**. Ik begin aan
secret-field tenzij je zegt dat de `type`-enum-verbreding (a) eerst moet omdat je
datumvelden anders klemzitten.

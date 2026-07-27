# lotc-rvo

RVO design-system implementation for [Lord of the Components](../../python). Ships
the RVO Python renderers and the RVO-specific Jinja templates (card, alert, grid,
menu, …), and registers itself with core via the
`lord_of_the_components.design_systems` entry point. Install it and declare
`setup_components(env, design_systems=["rvo"])`.

The theme-agnostic "system" layer (layout, basic HTML) and the shared template
macros live in core, not here.

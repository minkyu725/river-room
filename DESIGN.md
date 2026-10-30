# River Room design direction

Active refinement skill: [no-slop-ui](https://github.com/LeoStehlik/no-slop-ui), installed at `~/.codex/skills/no-slop-ui` on 2026-10-30. Read SKILL.md and its banned-pattern and colour-palette references before applying. The previous Anthropic frontend-design direction established the poker-table layout; this pass follows the user's correction that the warm treatment was excessive.

## Direction

A practical poker practice table on a neutral page. Keep color concentrated in the felt and actual playing pieces. Surrounding controls, labels and review rows should be quiet, legible and consistent. No beige wash, brown primary buttons, ornamental badges or repeated room wordmarks.

## Palette

- Page: neutral off-white `#f6f7f6`; surfaces `#ffffff`.
- Text: charcoal green `#28332f`; secondary text `#626e68`.
- Table: restrained green felt `#3e6655`; charcoal rail `#303c36`.
- Action: green `#335d49`; hover `#284c3b`.
- Borders: neutral `#d7ddd9`; soft fill `#edf0ee`.
- Actual playing pieces retain ivory cards, muted red suits and brass chips.

CSS variables in `style.css` are the contract. Do not recolor every element by shifting its hue; set colors by their functional role.

## Type and structure

Avenir Next / Apple SD Gothic Neo for the room name, controls, numbers and Korean copy. Keep Georgia only for card ranks: their traditional printed-card typography helps identify playing pieces, rather than decorating interface headings.

Preserve the game-first layout: setup, round information, opponents around the table, pot and fixed board slots, own hand, equity and actions. Opponent profiles and hand history sit beside play on desktop and below it on mobile. Center physical playing pieces; left-align explanations and review rows. Keep round information clear of the top seat's portrait.

## Restraint

Use 6px control corners, solid fills, subtle 1px borders and visible focus. Preset buttons have the same neutral treatment; all-in uses red text to distinguish its consequence. Reserve green fill for the primary action. Remove the decorative chip frame around the brand, live dot, duplicate table wordmark, pill-shaped presets and gold victory banner. Preserve the oval rail, player portraits, physical chip stacks and card-back pattern because these communicate the game and its seating.

Preserve audio, persistent stacks, fixed card nodes, dimmed undealt runout and hypothetical showdown review. Only newly revealed cards animate. Reduced-motion preferences remain respected. No new dependencies or fonts are needed.

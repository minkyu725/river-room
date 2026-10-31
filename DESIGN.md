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


## Seven-player table

Keep the existing neutral page, green felt/rail, Avenir/Apple Gothic UI and Georgia card ranks. No new typeface, decorative frame or palette change. Six opponents use two top seats, two middle side seats and two lower side seats; the hero remains at the bottom center and the board stays centered. A uniformly spaced extra seat would crowd the shared board, so the lower pair is placed outside its card row. On mobile only the seven-player felt grows to 500px to keep portraits, board and the hero hand separate. Existing smaller tables retain their dimensions. Preserve the custom listbox, 44px options, keyboard navigation/cancellation, reduced motion and the separate hole/board card-view groups.


## Compact probability and responsive review

Probability details show only unique-win and tied-first percentages. Remove the exhaustive denominator and total runout counts from the play screen; shared-first meaning stays in the existing note. On small screens the header can grow and wrap its controls as a group, keeping the brand unbroken. Seven-card hole/board groups can wrap as groups in narrow history columns; the mobile sidebar columns use zero minimum tracks. Preserve the card mats, five selected cards, existing palette and type.

Verified in the in-app browser at 320/390/720/768/950/1280/1440px, 2–7 players, completed/folded states and expanded history (42 layouts): no horizontal page overflow, header collision or board/seat-card collision. Targeted hero/side/lower-seat popovers checked at 320/768/1280px; short landscape help dialog at 844×390 scrolls within the viewport. Local QA fixtures set player count and completed state, use production rendering/CSS and are excluded from Pages. These are responsive browser checks, not a physical-device/all-OS certification.

A follow-up at 721px found two lower nameplates touching the board by about 2px in the narrow desktop grid. Between 721 and 800px, move the side rail below the table into two columns so the table retains usable width. Check the 800/801px transition as well as the existing 720/721 and 950/951 transitions.

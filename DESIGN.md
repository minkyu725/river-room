# River Room design direction

Applied skill: [Anthropic frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design), installed globally in ~/.codex/skills/frontend-design on 2026-10-30.

The interface is a poker table, opened directly for practice. The old promotional headline, decorative uppercase labels, acid-green accent and repeated dark panels distracted from play. The new direction uses the materials and seating of an actual card table.

Palette: cool grey page #e9edf0; navy leather rail #202832; blue felt #204e63; ivory playing cards #fffdf6; brass chips #bd9654; red suits #a34343.

Type: Palatino for the restrained room name and traditional Georgia card ranks. Avenir Next / Apple SD Gothic Neo for controls and Korean labels. Tabular numerals for stacks and equity.

Desktop layout:

```
Room name                                  Help
Table settings
Round / stage                   Opponent notes
      Seats around the rail     Previous hands
           Pot / board          Install
              My hand
My equity
Bet controls / fold / call / raise
Revealed hands
```

Mobile follows the same game-first order; notes and history sit below the controls. Center cards and pot, align controls and review text to the left. Put personality in the blue felt table and real card treatment; keep surrounding UI quiet. Do not reintroduce marketing headlines, all-caps eyebrow labels or generic dashboard cards.

The second pass adds playfulness through the game itself: five original SVG opponent portraits, a brass chip room mark, stacks that grow with the pot, a short board reveal, a win banner and tactile half-pot/pot/all-in controls. Motion responds to play and respects reduced-motion preferences. Card markup is preserved during unrelated renders so the board does not continually animate while opponents think.

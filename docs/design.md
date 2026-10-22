# Design guide

Orbit Explorer helps people understand a swap quote: what goes in, what comes out,
and which venues connect the two. The first screen should answer those questions
without requiring a wallet, account, or configuration.

## Information hierarchy

1. **Context:** page title, a visible sample/imported-data label, and an import action.
2. **Quote:** token pair, input and estimated output, then slippage and price impact.
3. **Route:** a generous diagram showing token flow, venue names, and branch weights.
4. **Evidence:** leg details and validated JSON for deeper inspection.

Keep sample selection close to the quote. Sample amounts are fixed examples, not
editable prices: changing an amount would imply a fresh quote that the app cannot
produce. State that demo data is synthetic; imported data is supplied by the user.

## Visual language

- Use midnight navy page and panel surfaces with restrained one-pixel borders.
- Reserve violet for the primary action and selected states; use soft cyan for route connectors.
- Keep star fields and nebula glows subtle, static, and behind the workspace.
- Use readable off-white text; muted labels must still meet contrast requirements.
- Use a normal text face for navigation and explanations, with tabular numerals
  for comparable amounts. Let spacing and type weight carry the hierarchy.
- Keep the desktop navigation narrow and the route canvas wide. Avoid decorative
  charts, fake activity feeds, and unrelated performance metrics.
- Keep shared spacing, colors, radii, and focus treatments in CSS custom properties.

Dashboard references informed the compact navigation, quiet panels, and generous
central workspace. Reference screenshots and third-party brand assets are not
distributed with this project.

## Interaction and accessibility

All actions need visible text or accessible names, keyboard access, and a distinct
focus ring. The import dialog must name its fields, explain accepted input, retain
invalid text for correction, and show a specific error without dismissing itself.
Escape closes the dialog and focus returns to the trigger.

Do not use the graph as the only representation of a route. The leg table should
provide its venue, tokens, amounts, and allocation in text. Branch weights describe
individual route legs, not a percentage sum across every hop.

Display unknown tokens with their mint identifiers and explicit unknown metadata.
Never guess decimals or present raw atomic amounts as human token amounts.
Label thresholds according to quote mode: minimum received for ExactIn and maximum
input for ExactOut.

On narrow screens, stack the quote and summary panels, simplify navigation, and
keep action targets comfortably tappable. Allow the diagram and data table to
scroll within their own containers instead of overflowing the page. Respect reduced
motion and never require hover to reveal essential information.

## Honest states

The initial page contains a useful sample. An invalid import explains how to fix
the input while keeping the existing quote available. Unsupported metadata and
complex routes should remain inspectable as text. No status indicator should imply
live market access, a network connection, trade execution, or a current price.

# Working on Orbit Explorer

This repository is a standalone public developer tool. Read `README.md` and
`docs/architecture.md` before making changes.

- Keep the current app browser-local: no API credentials, wallets, uploads,
  analytics, external fonts/images, or persistence. Provider integrations require
  an explicit scope change.
- Use only synthetic fixtures or clearly attributed public examples. Do not copy
  private repositories, configs, logs, operational data, or their Git history here.
- Keep token amounts as atomic-unit strings. Never guess unknown token decimals.
  Use `allocationPercent()` for per-leg allocations; `bps` takes precedence.
- Keep import validation in `src/lib/quote.ts` and layout math in
  `src/lib/route-layout.ts`. Preserve the textual alternative to the diagram.
- Add focused regression coverage for parser, precision, graph, or interaction
  bugs. Avoid tests that only repeat the implementation.
- Run `npm run check` and `npm run test:e2e` before finishing a code change.
- Keep the app usable by keyboard and on narrow screens. Never imply sample
  prices are live or that an imported quote has been verified for execution.
- Keep source files focused and documentation current. Do not add generated
  outputs, secrets, scratch files, or copied design references to Git.

# Architecture

Orbit Explorer is a static React and TypeScript application built with Vite. Quote
inspection runs in the browser. There is no backend, wallet connection, RPC client,
API credential, or trade submission path.

## Responsibilities

| Location              | Responsibility                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| `src/lib/quote.ts`    | Validate imported quote JSON, normalize display data, and format amounts without losing atomic-unit precision. |
| `src/data/samples.ts` | Small, explicitly synthetic examples of supported route shapes.                                                |
| `src/components/`     | Quote presentation, route visualization, details, and import interactions.                                     |
| Application entry     | Own the selected quote and coordinate sample/import changes.                                                   |
| Stylesheets           | Shared visual tokens, responsive layout, and component styling.                                                |
| `tests/`              | Browser journeys through the actual application.                                                               |

The route diagram uses native SVG and CSS. Keep route interpretation in ordinary
TypeScript so both the diagram and the textual details use the same normalized
data. Avoid a graph framework until the supported interactions justify one.

## Data flow

```text
Synthetic sample or user JSON
             |
       validate/normalize
             |
      selected quote state
         /       |       \
     summary   diagram   details + validated JSON
```

Parse untrusted input at a single boundary and return actionable validation errors.
`parseQuote(text)` accepts a quote object or a `quoteResponse` wrapper. Imports are
limited to 1 MiB and 64 route legs; normalization keeps only supported quote fields.
Do not partially replace the active quote when parsing fails. JSON inspection and
export use the sanitized quote rather than unrelated fields from an import.
Atomic amounts stay decimal strings or use integer arithmetic. Known token metadata
can improve readability, but unknown mints must remain usable without network calls.

Route legs may be sequential, split, or use intermediate tokens. A leg's percentage
is not a global route total; avoid rejecting valid multi-hop routes by summing every
leg. Any visual simplification must leave all legs available in the details.

## Privacy and deployment

Imports are processed in page memory. Do not send them to a server, analytics
service, URL, or browser persistence. Do not add third-party token images, fonts,
or scripts that create runtime requests. Static assets can be served by any static
host; the production build is the deployment artifact.

Keep future quote-provider integrations behind an explicit design decision. A
browser application cannot protect an embedded API secret. Real-time quoting would
also change the current privacy model and require its own operational ownership.

## Verification

Run `npm run check` for formatting, type checking, unit tests, and a production
build. Run `npm run test:e2e` for browser checks. Vitest covers validation, amount
formatting, and route interpretation. Playwright
covers the visible user journeys: loading samples, importing valid and invalid
JSON, navigating the import dialog by keyboard, and using a narrow viewport.
Type checking and a production build catch integration mistakes. Prefer behavioral
tests that protect those boundaries over tests of styling or component internals.

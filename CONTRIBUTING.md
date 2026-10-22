# Contributing

Orbit Explorer is a small public tool for inspecting Solana swap quote JSON. Keep
changes focused on making quotes easier to understand. Read the [design guide](docs/design.md)
and [architecture](docs/architecture.md) before adding a feature.

## Local workflow

Use Node 22.12 or newer and install dependencies with `npm ci`. Run `npm run dev`
for the local app. Before opening a pull request, run `npm run check` and
`npm run test:e2e`. The first browser-test run may require
`npx playwright install chromium`; see the README for setup details. Use
`npm run format` to apply the project's formatting.

Describe the user-visible problem and the resulting behavior in the pull request.
Include screenshots for layout changes and a short note about the checks you ran.
Use a focused branch and a descriptive conventional commit, for example
`fix(import): explain missing route fields`.

`main` is the only permanent branch. Create a short-lived `feat/`, `fix/`, `docs/`,
or `chore/` branch from current `main`, open a pull request, and squash-merge after
the `check` CI job passes. Delete merged topic branches. Keep history linear;
never force-push or delete `main`. See [GitHub setup](docs/github-setup.md) for the
prepared branch ruleset and deployment instructions.

## Change boundaries

- Put parsing and amount logic in `src/lib/quote.ts`, with regression tests for
  meaningful edge cases. Keep components concerned with presentation and interaction.
- Use synthetic fixtures. Never include credentials, private endpoints, wallet
  activity, operational data, or material copied from private repositories.
- Keep imported JSON local to the page. Adding a network request, persistence,
  wallet feature, or analytics changes the product's privacy contract and needs an
  explicit proposal before implementation.
- Favor native HTML, CSS, and SVG over new dependencies. Explain the need for any
  runtime dependency and keep the lockfile in sync.
- Check keyboard use, clear error states, and a narrow screen for interface changes.
  Retain textual access to information shown in diagrams.

Do not paste secrets or sensitive imported quotes into issues. Report a security
issue privately through the repository's security reporting channel when available.

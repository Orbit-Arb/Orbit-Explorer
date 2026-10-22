# GitHub setup

The project lives at `Orbit-Arb/Orbit-Explorer`. The SSH deploy key is restricted to
this repository. It can push Git refs, but it cannot administer repository settings.
The private key belongs on the development host, never in the repository or GitHub
Actions secrets. Pages deployment uses GitHub's built-in token and needs no SSH key.

## Branches and checks

`main` is the default and only permanent branch. Keep it releasable. Use short-lived
branches named `feat/<topic>`, `fix/<topic>`, `docs/<topic>`, or `chore/<topic>`, and
open a pull request back to `main`. Run the local checks, let the `check` CI job pass,
then squash-merge and delete the topic branch. Do not force-push or delete `main`.
There is no separate development or deployment branch.

After the first successful CI run, an owner can apply the prepared ruleset:

1. Open **Settings → Rules → Rulesets → New ruleset → Import a ruleset**.
2. Import [main.json](../.github/rulesets/main.json), review it, then create it.
3. In **Settings → General → Pull Requests**, enable squash merging and automatic
   deletion of head branches. Disable merge commits to keep history linear.

The ruleset requires pull requests, resolved review threads, a current passing
`check` result, linear history, and blocks force pushes and branch deletion. It
allows zero required approvals so a sole maintainer can merge their own PR after
checks; raise that number when another maintainer joins. Rulesets are available on
public Free repositories; private organization repositories may need a paid plan.

The JSON file documents the intended policy. Committing it does not activate it;
repository administration access is required to import it on GitHub.

## Visibility and Pages

For the public showcase, an owner must set **Settings → General → Danger Zone →
Change repository visibility → Public**. This publishes the repository's full Git
history, so only this standalone project should ever be pushed here.

Enable **Settings → Pages → Build and deployment → Source: GitHub Actions**. Open
**Actions → Deploy Pages → Run workflow**, select `main`, and start the workflow.
The workflow validates, runs browser checks, builds, and publishes the static app.
It refuses to build a deployment from a topic branch.

The expected project-site address is:

```text
https://orbit-arb.github.io/Orbit-Explorer/
```

That address is an expectation until GitHub reports a successful deployment.
Later deployments remain manual so pushing a commit alone does not publish it.

## Release identity

Use a maintainer's GitHub noreply address for commits if their personal email
should remain private. Release tags use `vMAJOR.MINOR.PATCH`; create a tag only for
a verified commit on `main` and describe the release in `CHANGELOG.md`.

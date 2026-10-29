# About

A website inside an SVG, inside an image, inside HTML, inside markdown, inside a GitHub readme.md.

Architecture ported from [terkelg/terkelg](https://github.com/terkelg/terkelg) (MIT). All credit for the
original idea and implementation goes to Terkel Gjervig.

> [!WARNING]
> This is all very experimental and may break any time.

## Development

Install dependencies

```bash
pnpm install
```

Fetch the GitHub contributions. **Required before the first `pnpm start`** — `src/stats.json` is
generated and gitignored, and the worker imports it. Needs a `.env` with
`API_TOKEN_GITHUB=<classic PAT, read:user>`.

```bash
pnpm stats:local
```

Start the dev server.

```bash
pnpm start
```

A GitHub action refreshes the contribution count and graph hourly (at minute 17 UTC;
scheduled runs can be delayed by GitHub). Both use the same generated snapshot.
The count shows contributions, including activity other than commits, since December 11, 2022,
abbreviated above 1,000 (for example, `1.5k`).
The graph date shows the snapshot date in UTC, rather than the visitor's current date.

`pnpm build` generates both themes in `dist/`. The README loads these SVG files through
Cloudflare Static Assets without invoking the Worker. Legacy query URLs still use the Worker.
Images can be cached for five minutes. The deployment workflow also supports manual runs.

GitHub disables scheduled workflows in public repositories after 60 days without repository
activity. If updates stop, open Actions → Regenerate, enable the workflow, and run it manually.
Changing the cron expression also reactivates a workflow disabled by inactivity when pushed
to the default branch. Hourly runs alone do not prevent GitHub's inactivity cutoff.

To deploy from your machine:

```bash
pnpm run deploy
```

Check changes with `pnpm types`, `pnpm lint`, and `pnpm test`.

## Tips & Tricks

- To purge the asset from the GitHub cache run `curl -w "\n" -s -X PURGE https://camo.githubusercontent.com/....`

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

A GitHub action rebuilds and redeploys every 12 hours to refresh the contribution graph.
To deploy from your machine:

```bash
pnpm run deploy
```

## Tips & Tricks

- To purge the asset from the GitHub cache run `curl -w "\n" -s -X PURGE https://camo.githubusercontent.com/....`

# How this profile works

`README.md` is what shows on github.com/twoallbeefpatties. It's generated — edit **`profile.json`** instead.

```
profile.json              ← all the words, links, projects and burger layers
scripts/build.mjs         ← renders every tile + README.md + dist/preview.html
scripts/lib/tiles.mjs     ← the drawings (hero, burger, cards, heatmap, nutrition label…)
scripts/lib/stats.mjs     ← GitHub GraphQL query for the live numbers
scripts/lib/text.mjs      ← font measuring/wrapping; embeds subset fonts in each SVG
scripts/lib/readme.mjs    ← README layout (<picture> tags) and the preview page
.github/workflows/build.yml ← nightly rebuild, publishes tiles to the `output` branch
```

## First-time setup

1. **Repo name.** GitHub only shows a profile README from a public repo named exactly like your username:
   `twoallbeefpatties/twoallbeefpatties`. Either rename `theonlytruebigmac` to `twoallbeefpatties`
   (Settings → General → Repository name) and replace its contents with this folder, or create a new
   repo with that name.
2. Push this folder to the `main` branch.
3. Actions tab → **Build profile** → **Run workflow** (it also runs on every push and daily at 07:17 UTC).
   The first run creates the `output` branch that the README's images point to — until then the images are broken.
4. If the run fails on the push step: Settings → Actions → General → Workflow permissions → **Read and write**.

Optional: add a `PROFILE_TOKEN` repo secret (a fine-grained token with read-only access) if you want the
Action to see more than public data. The built-in token is enough for everything shown today.

## Editing

```bash
npm ci
npm run demo                 # fake numbers, no token needed
xdg-open dist/preview.html   # dark / light / phone views, like GitHub will show them
GITHUB_TOKEN=$(gh auth token) npm run build   # real numbers
```

Commit `profile.json` **and** the regenerated `README.md`. (If you forget the README, the Action regenerates and commits it.)

Things in `profile.json` still waiting on you:
- `now` — what you're cooking right now and its link
- the `email` link (left blank, so no Email button is drawn)
- `details` — kitchen history and allergen info are placeholders in `[brackets]`

## What GitHub allows (and what goes on the website instead)

| Works in the README | Not possible — save for the GitHub Pages site |
|---|---|
| Links around whole images (each card/button clicks) | Hover effects, tooltips |
| CSS animation inside an SVG (bun drop-in, pulsing dots) | Clicking part of one image (a single burger layer) |
| Dark/light + phone variants via `<picture>` | JavaScript, live data, forms, embeds |
| Numbers refreshed on a schedule by the Action | Real-time anything |
| `<details>` click-to-expand sections | Custom page fonts (they're baked into each SVG) |

To link the website later, add it to `links` in `profile.json` and point `fullMenuUrl` at it.

# FALCON view

A standalone research-method page for **FALCON: A unified model of direct genetic
support**, built on the same structure as the other method views in this repo
(`page-header` → title card → `b-tabs` card → feature card → `page-footer`).

This commit is **purely additive** — it adds new files only and does not modify or
remove anything that already exists. One small edit is therefore still needed to
register the page with the build; see [Incorporating the view](#incorporating-the-view).

## What is included

| Path | Purpose |
| --- | --- |
| `src/views/FALCON/Template.vue` | The page itself: Abstract / Documentation / User guide tabs, the "how FALCON works" infographic, and the embedded FALCON Zoom tool. |
| `src/views/FALCON/main.js` | Standard page entry point (Vue instance + `pageMixin`). Identical to the other method views. |
| `src/views/FALCON/store.js` | Standard Vuex store (`bioPortal` + `kp4cd` modules). Identical to the other method views. |
| `public/falcon/falcon_model.svg` | Figure 1 of the paper, used as the infographic. |
| `public/falcon/zoom/**` | Self-contained copy of the FALCON Zoom tool (HTML, CSS, JS, and its trait/gene lookup tables), embedded in an `<iframe>` by `Template.vue`. |

## Incorporating the view

Add a `falcon` entry to the `pages` object in `vue.config.js` (alongside the
existing entries — nothing needs to be removed or renamed):

```js
    falcon: {
        entry: "src/views/FALCON/main.js",
        template: "public/index.html",
        filename: "FALCON.html",
        title: "FALCON: A unified model of direct genetic support",
        chunks: ["chunk-vendors", "chunk-common", "falcon"],
    },
```

Then build and serve as usual:

```
npm run build
```

The page is served at `/FALCON.html`.

## Notes for reviewers

**FALCON Zoom is vendored, not hot-linked.** `Template.vue` embeds
`public/falcon/zoom/` from this repo's own origin rather than pointing an iframe at
the external FALCON site, so the view keeps working regardless of what happens to
that deployment. The iframe `src` uses the directory form
(`falcon/zoom/?gene=ABCA1&trait=LDL`) — a trailing-slash URL — because the clean-URL
redirect on `/falcon/zoom/index.html` would otherwise re-resolve the page's relative
asset paths one directory too high.

**One external runtime dependency.** The vendored `public/falcon/zoom/app.js` fetches
model results from the FALCON BioIndex API at
`https://d26k96aakgfksz.cloudfront.net` (see `FALCON_API_ORIGIN` at the top of that
file). This is a plain cross-origin API call — it serves the precomputed model
outputs that the plots and tables display, so it cannot be vendored — and it is the
only thing this view needs from outside the repo. Everything the page *renders* is
local.

**Zoom is rendered outside the tab component, on purpose.** The Zoom card is a
sibling of the `b-tabs` card, not a child of one of the tabs. Switching between
Abstract / Documentation / User guide therefore leaves the iframe untouched, so
Plotly never has to redraw the charts (and a user does not lose an analysis they are
part-way through reading).

**The embedded Zoom is pinned to the light theme** and has its own style overrides in
`public/falcon/zoom/index.html`: the standalone site's navbar spacing is removed, the
page heading is hidden (the card supplies its own), and the control row is compacted
so all selections fit on a single line at portal widths.

**`main.js` and `store.js` are unmodified boilerplate** copied from the existing
method views, so they contain nothing FALCON-specific and should need no review
beyond confirming that.

## Links out to the full FALCON platform

`Template.vue` links to `https://d26k96aakgfksz.cloudfront.net/` — the full FALCON
site, which hosts the complete Discover and Validate tools and the paper. All such
links open in a new tab (`target="_blank" rel="noopener noreferrer"`).

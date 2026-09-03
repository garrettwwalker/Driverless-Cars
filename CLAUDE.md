# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"The Standing Cost" — a single-page **advocacy website** arguing that the U.S. passively
accepts road deaths, wasted time, and wasted land by not deploying driverless cars faster.
The framing is intentionally one-sided; the factual integrity rules below are what keep it
defensible.

## No toolchain

There is no build step, no `package.json`, no bundler, no test runner, no linter, and
**no Node.js on this machine**. It is four hand-written static files served as-is.

```sh
python3 -m http.server 8000      # then open http://localhost:8000
```

Because there is no JS runtime, you cannot `node --check` a file. `app.js` is one big IIFE,
so a **single syntax error anywhere silently disables the entire page** — every figure stays
on its HTML placeholder (`0` / `—`) and nothing throws visibly in the UI. When editing
`app.js`:

- The page has a built-in guard: `window.onerror` renders a red `#errbar` at the bottom with
  the failing file/line. If numbers are stuck at `0`, look there first, then the browser console.
- A quick static sanity check without Node: a Python brace/quote-balance scan catches the
  common "unterminated string / unbalanced bracket" class of bug that breaks the whole file.

## Architecture

Four files, one direction of data flow: **`data.js` → `app.js` → DOM**.

| File | Role |
| --- | --- |
| `data.js` | **Single source of truth.** Defines `window.DATA` — every statistic, every quote, every source URL, and the model's default parameters. Nothing else holds data. |
| `index.html` | Static structure for all six tabbed sections. Text nodes contain hardcoded placeholder values that `app.js` overwrites on load. Scripts load at end of `<body>`, `data.js` before `app.js`. |
| `app.js` | One IIFE. No framework, no modules, no dependencies. Reads only from `DATA`. |
| `styles.css` | CSS custom properties at `:root` (colors, `--mono`, `--radius`, `--wrap`); dark theme only. |

### `app.js` structure

- Top: helpers (`$`, `$$`, `fmtInt`, `fmtUSD`, `fmtCompact`), then the **model** functions
  (`autonomousShare`, `modelRows`, `cumulativeNow`, `perSecondPreventable`).
- `barChart(el, data, opts)` — hand-rolled SVG bar chart builder (no chart library). `data`
  is `[{label, actual, prevent}]`; `prevent` draws as a red overlay from the baseline.
- One `bind<Section>()` function per tab (`bindToll`, `bindTime`, `bindSpace`, `bindRecord`,
  `bindCities`, `bindMethod`) plus `bindTabs()`. The init block at the bottom calls each once.
- Live counters: `frame()` runs on `requestAnimationFrame`, extrapolating from `liveBase` +
  `livePerSec × elapsed`. `recomputeLive()` resets those whenever a slider changes.

### The model (Toll tab)

For each year from the user-chosen start year to the current year:

```
preventable(year) = road_deaths(year) × autonomous_share(year) × crash_reduction
```

`autonomous_share` is a straight-line ramp to 50% over `yearsTo50` years, capped at
`DATA.model.shareCap`. The current year is prorated by fraction elapsed. All three inputs
(`startYear`, `yearsTo50`, `reduction`) are sliders; defaults live in `DATA.model`. It is
presented in the UI as an adjustable estimate, never as measured fact — keep it that way.

## Editorial integrity (non-negotiable)

- **Every number in `data.js` needs a real `source` + `sourceUrl`.** Do not invent or
  round-until-wrong. If updating a stat, update its source too.
- **Quotes are verbatim.** Each quote object carries `who`, `role`, `when`, `context`, `url`.
  Never fabricate, trim misleadingly, or re-attribute. Non-verbatim entries must set
  `paraphrase: true` (renders a visible "paraphrase" tag).
- The Method tab must keep listing every source and the model's caveats
  (`DATA.model.caveats`).

## Making changes

- **Change a figure or quote:** edit `data.js` only.
- **Add a stat to an existing tab:** add it to `DATA`, add a placeholder element with an
  `id` in `index.html`, populate it in that tab's `bind` function.
- **Add a tab:** add a `<button class="tab" data-tab="x">` and `<section class="panel"
  id="panel-x">` in `index.html`, write `bindX()`, call it from the init block. `bindTabs()`
  wires routing and `#hash` deep-links automatically.

## Git

Plain `git push` **hangs** in this environment (no credential helper → silent prompt). It is
fixed once per machine with `gh auth setup-git`. Commits are kept small and single-purpose.

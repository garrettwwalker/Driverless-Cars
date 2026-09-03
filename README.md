# The Standing Cost

An advocacy website about the passive trade-off the United States makes by holding
back the rollout of driverless cars: the road deaths, the wasted time, and the city
land we accept every year that autonomous vehicles are kept off the road.

The framing is a point of view. The underlying figures are sourced, and the central
"preventable deaths" number is a transparent, user-adjustable scenario model — not a
claim of measured fact.

## What's in it

| Tab | Content |
| --- | --- |
| **The toll** | Live-updating estimate of preventable road deaths since a year you choose, with sliders for deployment start year, adoption speed, and crash-reduction rate. Year-by-year arithmetic is shown. |
| **Wasted time** | INRIX congestion figures; a calculator for hours and dollars lost over a driving lifetime. |
| **Reclaimed space** | Academic estimates of U.S. parking supply and the land it occupies. |
| **The Waymo record** | Waymo's published safety numbers plus independent (IIHS) and peer-reviewed checks. |
| **Cities** | Deployment status and verbatim, sourced quotes from officials in New York, Boston, and Washington, D.C. |
| **Method & sources** | The model's formula and assumptions, every source on the page, and a note on how the quotes were handled. |

## Running it

It's a static site — no build step, no dependencies (Google Fonts is the only external
request).

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Editing the numbers

Every figure lives in [`data.js`](data.js) with its source and a link. The UI reads
only from there. To update a statistic or a quote, edit that file — nothing else.

- `index.html` — page structure
- `styles.css` — all styling
- `app.js` — model math, charts, counters, tab navigation
- `data.js` — **all data and sources**

## Method, in short

For each year from the chosen start year to now:

```
preventable(year) = recorded_road_deaths(year) × autonomous_share(year) × crash_reduction
```

`autonomous_share` is a straight-line ramp to 50% over the number of years you set
(capped at 95%); `crash_reduction` is the slider (default 85%, versus Waymo's reported
92% for serious-or-fatal-injury crashes). The current year is prorated by how much of
it has elapsed. Full caveats are on the Method tab.

## Sources

NHTSA (FARS and early estimates), INRIX 2025 Global Traffic Scorecard, Waymo Safety
Impact Hub, IIHS, *Traffic Injury Prevention* (2025), and parking research by Donald
Shoup and Eric Scharnhorst / RMI. Each is linked inline and listed on the Method tab.

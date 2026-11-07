# Climate Stripes Studio

A polished, responsive, static web project built with **vanilla HTML, CSS and JavaScript (ES modules)**. No framework, package manager, build step, or backend is required.

## Run it

1. Extract `climate-stripes-studio.zip`.
2. Open the extracted folder.
3. Double-click `index.html` to launch it in Edge, Chrome, or Firefox.

The project also works on GitHub Pages. Upload the contents of this folder to a repository and enable Pages.

## What makes it special

- **Interactive warming stripes:** hover to inspect a year and click a stripe to select it.
- **Timeline explorer:** select a custom year range or jump to the last 50, 30, or 10 years.
- **Animated timeline:** play through the annual record.
- **Two visual modes:** classic warming stripes or a bar view.
- **Three colour treatments:** balanced, high contrast, and soft tones.
- **Year inspector:** selected-year anomaly and context.
- **Long-term chart:** annual anomaly trajectory with selected-year marker.
- **Then vs now comparison:** compare a selected 30-year period with the latest 30 years.
- **Export tools:** download the current stripes as PNG or the visible records as CSV.
- **Shareable views:** copy a URL that remembers the current range, selected year, scale, and view.
- **Responsive layout and light/dark toggle.**

## Data and accuracy

The app attempts to load the current annual global land-ocean temperature anomaly series from NASA GISTEMP v4:

`https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv`

NASA reports these anomalies relative to the 1951–1980 average. The CSV is parsed in the browser. A network connection is required for the live NASA series.

If the CSV cannot be reached (for example, when offline or if the host blocks the browser request), the interface automatically uses a **small built-in illustrative preview series** so the project remains interactive. The interface labels this state as `OFFLINE PREVIEW · DEMO SERIES`. Do not present the fallback preview as official observations.

Data source: NASA Goddard Institute for Space Studies (GISS), GISTEMP v4. See [NASA GISTEMP data downloads](https://data.giss.nasa.gov/gistemp/data_v4/) for methodology and updated source files.

Warming stripes concept: [Show Your Stripes](https://showyourstripes.info/).

## Project structure

```text
climate-stripes-studio/
├── index.html
├── styles.css
├── app.js
└── README.md
```

## Customise

- Change colours in `styles.css` (`:root` variables).
- Change the colour interpolation stops in `app.js` (`colorStops`).
- Change the chart and stripe layout in `app.js`.
- The NASA CSV URL is stored in `app.js` as `NASA_CSV`.

## Notes

- The site uses Google Fonts when internet access is available; system fallbacks are included.
- No external JavaScript libraries are used.
- The project does not send data to a server or store personal information.

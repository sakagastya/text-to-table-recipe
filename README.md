# Matrix Kitchen

Convert raw recipe text into a sleek, editorial **"Cooking for Engineers" tabular matrix** — entirely in the browser. No backend, no build step, no dependencies to install.

## Features

- **AI Auto-Extract** — paste a messy blog post, bring your own Gemini or OpenAI API key (stored only in your browser's `localStorage`), and the model returns pure DSL.
- **DSL Code Studio** — live editor with instant re-rendering.
- **Track reordering** — hover a parallel branch's first row and use the ▲ ▼ controls to move whole group blocks within the DSL; merges resolve by name, so table topology is never broken.
- **Portion multiplier** — ½× / 1× / 2× / 5×, scales every quantity in real time.
- **Cooking mode** — click action/ingredient cells to gray out completed steps.
- **Shopping list** — consolidates duplicate ingredients into summed quantities as a checklist.
- **Theme & export** — live accent themes, font/padding sliders, and **Save as PNG** via CDN-loaded `html2canvas`.
- **Metric enforcement** — cups / oz / lbs / pints / quarts / gallons are auto-converted to g / mL; spoon measures (tsp, Tbs) are preserved.

## The DSL

```
Title: Recipe Name            table title
## COMPONENT: Sauce           starts a new modular table
[Group Name]                  declares a parallel branch
- 100 g tomatoes, chopped     ingredient row
> action                      merges all active ingredients above it
> (wait)                      pushes ingredients right without merging
> action (Group A, Group B)   middle-out merge of named parallel groups
```

A `>` action on the first line after the title renders as a full-width header step (e.g. `> Preheat oven to 175 C`). Action cells with `rowspan >= 3` automatically rotate their text vertically.

## Deploy to GitHub Pages

1. Push these files (`index.html`, `styles.css`, `script.js`, `README.md`) to a GitHub repository.
2. Open the repo → **Settings** → **Pages** (left sidebar).
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose branch **`main`** and folder **`/ (root)`**, then click **Save**.
5. Wait ~1 minute; your app goes live at `https://<username>.github.io/<repo>/`.

## Local use

Just open `index.html` in a browser — everything runs client-side. (The AI extraction requires an internet connection for the provider API call; everything else works offline.)

## Privacy

Your API key and recipes are stored only in your browser's `localStorage` and are sent exclusively to the AI provider you choose. If you paste a **link**, the page is fetched through a public reader proxy (`r.jina.ai`, fallback `allorigins.win`) — the URL itself is shared with that service. Works with publicly accessible pages and video pages (e.g. YouTube) as long as there is readable text on the page.

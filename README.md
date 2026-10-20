# Hobby Ledger

A ledger of the things you do for fun: what each one gives you, what it costs you, and where your spare time actually goes. It's an offline Progressive Web App. You install it on your phone from the browser and all data stays on the device (IndexedDB).

## What it does

- **Ledger** - every activity with its ratings and time cost. Sort by value, any single rating, quickest, least setup or time per week. Filter by tag and search.
- **Activities** have:
  - *What it gives you* (1-5): enjoyment while doing it, how much you look forward to it, how you feel afterwards
  - *What it costs you*: effort (1-5), setup, session and teardown time in minutes
  - roughly how many hours a week you spend on it now
  - tags (free text, e.g. `board game`, `solo`, `screen`) and notes
- **Overview** - total hours per week, a time-against-value chart, your time sinks and under-used gems, the most fiddly activities to set up, and a per-tag summary.
- **Pick for me** - say how much time and energy you've got (and optionally which tags you're in the mood for), and it picks something that fits.
- **Backup** - export and import a JSON file.

## How the numbers work

- **Value** = (enjoyment + anticipation + 2 × afterwards) / 4. How you feel afterwards counts double, because lasting enjoyment is the thing this app tries to bring out.
- **Time sink** - 3+ hours a week with a value under 3.
- **Under-used gem** - value 4+ but less than 1 hour a week.
- **Pick for me** only picks activities whose setup + session + teardown fits your time and whose effort is at or below your energy. The chance of each one coming up is weighted by value², and it doesn't repeat until it has gone through everything that fits. Time sinks are left out unless you untick that option.

The thresholds live in `src/engine/scores.ts`.

## Development

```sh
npm install
npm test          # engine tests
npm run typecheck
npm run dev       # build and serve on http://localhost:3000
npm run build     # production build into dist/
npm run icons     # regenerate PNG icons from the SVGs (needs: npm i -D sharp)
```

React + TypeScript, bundled with esbuild. No runtime dependencies apart from React.

## Deploying

Pushing to `main` deploys the site to GitHub Pages using `.github/workflows/deploy.yml`, which tests, builds and publishes it.

1. In the repository, open **Settings > Pages** and set **Source** to **GitHub Actions**.
2. Re-run the workflow from the **Actions** tab if the first run finished before Pages was enabled.

The app is then live at `https://<user>.github.io/hobby-ledger/`. Open it in Chrome on Android and choose **Add to Home screen** / **Install app**. On iPhone, use Safari's **Share > Add to Home Screen**. Later pushes redeploy, and the installed app shows an update banner the next time it opens.

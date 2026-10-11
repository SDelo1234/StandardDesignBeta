# Heras Fencing Tools

This project refactors the original single-file fencing demo into a modern Vite + React + Tailwind application with React Router and a shared authentication context.

## How the design check works

`src/utils/fenceDesign.js` holds the whole calculation as pure functions, used by the page, the PDF and the tests:

1. **vb** = vb,map · c_dir · c_season · c_prob · c_alt (BS EN 1991-1-4 + UK NA), with return periods from BS EN 1991-1-6 Table 3.1 and a 20 m/s execution minimum (EN 1991-1-6 3.1(5)).
2. **qb** = ½ρvb², ρ = 1.226 kg/m³.
3. **qp** = ce · ce,T · c_o² · qb. ce and ce,T approximate UK NA Figures NA.7/NA.8 (EN 1991-1-4 profile blended by distance to sea); an engineer can override them with values read from the figures.
4. Each fence system in `src/utils/fenceSystems.js` passes if qp ≤ its capacity and the fence height ≤ its maximum height. Capacities are peak velocity pressures: cp,net is already included in the fence system design.

There is no fallback wind speed: if vb,map or altitude can't be found, the user must enter them.

## Data

* `public/data/vbpostcode.csv` – vb,map by postcode district.
* `data/Postcode_elevation.csv` – altitude by postcode. `scripts/build-altitude-shards.mjs` splits it into one small JSON file per district under `public/data/alt/` (git-ignored). This runs automatically before `npm run dev` and `npm run build`.
* Geocoding uses [postcodes.io](https://postcodes.io); map tiles come from OpenStreetMap.

`npm run check:datasets "SW4 6QD"` prints the looked-up values for a postcode.

## Project Structure

```
src/
  components/   inputs, map, results, calc trace, charts, fence options, admin
  context/      AuthContext (PIN login)
  hooks/        useGeo (postcodes.io), useWind (vb,map + altitude lookup)
  pages/        Fences, Login, Tools, Shafts, Admin
  utils/        fenceDesign (engine), fenceSystems, datasets, designBrief (PDF), pinStore
tests/          node --test unit tests
```

* **Login** – PIN accounts are stored in the browser with hashed PINs. This is a convenience gate, not server-side security.
* **Admin** – `/admin` manages PIN accounts on this browser. The default admin PIN is 0000; change it on first use.

## Getting Started

```bash
npm install
npm run dev
npm test
```

Open the printed URL (usually http://localhost:5173) in a browser to exercise the full routed experience. Tailwind classes are already configured via `postcss.config.js` and `tailwind.config.js`.

## Building for Production

```bash
npm run build
npm run preview
```

`npm run preview` serves the generated `dist/` folder at http://localhost:4173 for smoke testing the production bundle.

## Publishing to GitHub

Use the helper script to connect a remote and push the branch in one step:

```bash
./scripts/publish-to-github.sh https://github.com/<your-username>/<repo-name>.git
```

What the script does for you:

1. Verifies you're inside this repository.
2. Adds (or updates) the `origin` remote to match the URL you supply.
3. Pushes the current `work` branch (pass a different branch name as a second argument if desired).

You can re-run the script anytime you need to push new commits. It will print each action so you can replicate the commands manually if you'd rather run them yourself.

> **Tip:** run `git status -sb` anytime to check whether there are uncommitted changes before pushing.

## Resolving merge conflicts in the GitHub web editor

If GitHub reports conflicts after you push, you can often resolve them directly in the browser:

1. Open your pull request and click **Resolve conflicts**.
2. For each file, review the highlighted sections. The block between `<<<<<<<` and `=======` shows your branch; the block between `=======` and `>>>>>>>` shows the base branch.
3. Edit the file so that only the desired lines remain and all conflict markers are removed.
4. Click **Mark as resolved** and then **Commit merge** to save the fixes.

For large CSV updates or when you need to run local tests, prefer resolving conflicts on your machine so you can validate the output before committing.

## Deployment Notes

The project targets Node 18 or 20. Configure your hosting (e.g., Vercel) with:

- **Install:** `npm install`
- **Build:** `npm run build`
- **Output directory:** `dist`


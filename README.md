# Heras Fencing Tools

This project refactors the original single-file fencing demo into a modern Vite + React + Tailwind application with React Router and a shared authentication context.

## Project Structure

```
src/
  components/
    FenceInputs.jsx
    FenceOptions.jsx
    Header.jsx
    Login.jsx
    Map.jsx
    Selector.jsx
    WindResults.jsx
  context/
    AuthContext.jsx
  hooks/
    useGeo.js
    useWind.js
  pages/
    FencesPage.jsx
    LoginPage.jsx
    ShaftsPage.jsx
    ToolsPage.jsx
  App.jsx
  main.jsx
```

* **Login flow** – `/login` asks for the PIN and stores the session in `AuthContext`.
* **Tools hub** – `/tools` lets users choose between fence calculations and shafts (coming soon).
* **Fences workflow** – `/tools/fences` combines inputs, wind lookup, map updates, and fence option filtering.
* **Shafts placeholder** – `/tools/shafts` renders a temporary message until implemented.

## Getting Started

```bash
npm install
npm run dev
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


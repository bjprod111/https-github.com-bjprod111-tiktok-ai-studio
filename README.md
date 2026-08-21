# TikTokApp mobile

Root directory: `C:\TikTokApp-mobile.worktrees\mobile-responsive-ui-redesign`

To run the complete local app on Windows, double-click `Run-Pulse-Studio.bat` in this folder. It finds an available localhost port starting at `3000`, starts the backend, and opens the app in your browser.

A mobile-first companion to the Streamlit TikTok AI Content Studio. It is a free static web app with local demo generation and browser-only saved ideas.

## Run locally

From this folder:

```powershell
py -m http.server 5173
```

Open http://localhost:5173 in a browser. The app is a free local demo: it generates sample ideas, scripts, captions and hashtags in the browser, so no API key is required for preview.

## Architecture blueprint

A mobile-first product and workflow blueprint is available in the [architecture/mobile-ui-blueprint.md](architecture/mobile-ui-blueprint.md) file.

## Real backend and app flow

This project now includes a real Node.js + Express + SQLite backend with:

- user registration and login
- JWT authentication
- project CRUD
- export to JSON/TXT/Markdown
- share links
- analytics overview
- one-page app flow with separate interactive views

Run it locally with:

```powershell
npm install
npm start
```

Open one link on one port:

- http://localhost:3000/

The app uses a single-entry mobile experience, while switching between login, dashboard, studio and project editor views in the same app shell.

The backend binds to `127.0.0.1` by default, so it is not shared with other devices on the local network. For any production backend deployment, set a strong `JWT_SECRET` environment variable and use HTTPS.

## Publish for free with GitHub Pages

GitHub Pages is the secure deployment option for the mobile browser studio. The workflow publishes only the static browser files; it does not publish the Node.js backend, SQLite database, dependencies or local transfer archive. It uses GitHub's HTTPS Pages hosting and does not require a tunnel to your computer.

The repository remote must point to your actual GitHub repository. The current local remote is still a placeholder: `https://github.com/YOUR_USERNAME/tiktok-app-mobile.git`.

1. Create a new GitHub repository, for example `tiktok-app-mobile`.
2. Upload the contents of this folder to the repository root.
3. Push to the `main` branch.
4. In GitHub, open **Settings > Pages**, choose **GitHub Actions**, and wait for the `Deploy Pulse Studio` workflow.
5. GitHub will show the public URL under **Settings > Pages**.

The app works without a backend, database or paid API. Saved ideas stay on each user's device. Do not put Gemini, Anthropic or OpenAI keys in `app.js` or any browser file.

For production AI calls, add a small server-side proxy later. Do not put Gemini, Anthropic or OpenAI keys in `app.js` or any browser file.

# TikTokApp mobile

Named root directory: `C:\TikTokApp-mobile.worktrees\mobile-responsive-ui-redesign`

Single-file local launcher: double-click `Run-Pulse-Studio.bat` in the named root directory. It finds an available localhost port starting at `3000`, starts the backend on `127.0.0.1`, and opens the app in your browser. Nothing is exposed to your cafe or local network.

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

### Optional Claude connection

Claude is supported only through the local backend. Set your key in the server environment and never paste it into the app, GitHub, or chat:

```powershell
$env:ANTHROPIC_API_KEY = 'paste-your-key-in-this-terminal-only'
$env:JWT_SECRET = 'use-a-long-random-local-secret'
npm start
```

Check `http://127.0.0.1:3000/api/ai/status` to confirm whether Claude is connected. GitHub Pages intentionally uses the local demo fallback because static hosting cannot protect an API key.

## Publish for free with GitHub Pages

GitHub Pages is the secure deployment option for the mobile browser studio. The workflow publishes only the static browser files; it does not publish the Node.js backend, SQLite database, dependencies or local transfer archive. It uses GitHub's HTTPS Pages hosting and does not require a tunnel to your computer.

The connected GitHub repository is `https://github.com/bjprod111/https-github.com-TON_USERNAME-tiktok-ai-studio.git`.

1. Push changes to the `main` branch.
2. GitHub Actions publishes only the static frontend files.
3. The deployed app is available at `https://bjprod111.github.io/https-github.com-TON_USERNAME-tiktok-ai-studio/`.

The app works without a backend, database or paid API. Saved ideas stay on each user's device. Do not put Gemini, Anthropic or OpenAI keys in `app.js` or any browser file.

For production AI calls, add a small server-side proxy later. Do not put Gemini, Anthropic or OpenAI keys in `app.js` or any browser file.

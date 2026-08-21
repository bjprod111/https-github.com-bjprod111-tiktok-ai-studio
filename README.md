# TikTokApp mobile

A mobile-first companion to the Streamlit TikTok AI Content Studio. It is a free static web app with local demo generation and browser-only saved ideas.

## Run locally

From this folder:

```powershell
py -m http.server 5173
```

Open http://localhost:5173 in a browser. The app is a free local demo: it generates sample ideas, scripts, captions and hashtags in the browser, so no API key is required for preview.

## Architecture blueprint

A mobile-first product and workflow blueprint is available in the [architecture/mobile-ui-blueprint.md](architecture/mobile-ui-blueprint.md) file.

## Publish for free with GitHub Pages

1. Create a new GitHub repository, for example `tiktok-app-mobile`.
2. Upload the contents of this folder to the repository root.
3. Push to the `main` branch.
4. In GitHub, open **Settings > Pages**, choose **GitHub Actions**, and wait for the `Deploy Pulse Studio` workflow.
5. GitHub will show the public URL under **Settings > Pages**.

The app works without a backend, database or paid API. Saved ideas stay on each user's device. Do not put Gemini, Anthropic or OpenAI keys in `app.js` or any browser file.

For production AI calls, add a small server-side proxy later. Do not put Gemini, Anthropic or OpenAI keys in `app.js` or any browser file.

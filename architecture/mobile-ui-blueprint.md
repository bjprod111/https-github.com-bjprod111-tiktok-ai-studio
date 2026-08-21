# Mobile-first UI Blueprint

## 1. Product goal
This app is a mobile-first content studio for creators that can generate TikTok ideas, scripts, captions, and hashtag directions without a backend. It is optimized for Android and iPhone browsers and behaves like a modern app shell rather than a desktop-heavy landing page.

## 2. User experience architecture
- Top bar with brand and quick settings access
- Hero section with premium messaging and live status signal
- Small stat chips to reinforce momentum
- Three-field configuration panel for content lane, tone, and length
- Mode selector for Ideas, Script, Captions, and Tags
- Input prompt and primary action button
- Scrollable result cards for generated content
- Fixed bottom navigation for mobile-first browsing
- Toast notifications for lightweight feedback

## 3. Layout system
- Container width: mobile-first, centered, app-like shell
- Safe-area aware bottom padding for iPhone notch and gesture zones
- Large tap targets for thumbs and mobile comfort
- Glassmorphism and layered gradients to give premium motion without clutter
- Card border radius, soft shadows, and spacing tuned for small screens

## 4. Interaction flow
1. User selects a content lane in the control panel.
2. User chooses tone and video length.
3. User taps a mode tab depending on the need: ideas, script, captions, or hashtags.
4. User enters a niche or content topic into the prompt field.
5. App generates AI-like structured suggestions locally in-browser.
6. User can save ideas to local storage or continue iterating.
7. Saved items are kept on-device only for privacy-friendly behavior.

## 5. State model
- `state.mode`: current creative mode (`ideas`, `script`, `captions`, `hashtags`)
- `lastResults`: last generated set for current mode
- Local storage key: `pulse-saved`
- Data is generated from a deterministic JS template engine, not external APIs

## 6. Frontend structure
- `index.html`: app shell and mobile layout structure
- `styles.css`: premium mobile-first visual system and responsive behavior
- `app.js`: state transitions, local generation logic, saved item handling
- `manifest.webmanifest`: installable app metadata
- `sw.js`: service worker for PWA readiness

## 7. Responsive behavior
- Mobile default: single column, compact cards, bottom navigation fixed
- Tablet/desktop: centered app shell, slightly expanded spacing, improved composition
- Safe-area support: `env(safe-area-inset-bottom)` built into spacing and fixed nav
- Large tap targets and full-width interactive controls help Android and iPhone compatibility

## 8. Implementation notes
- No backend required for the current demo, so the interface runs instantly and works offline after first load
- Future upgrades can add an API proxy layer for real generation without changing the UI contract
- The architecture is intentionally modular so the front-end can evolve into a real product without a full rebuild

## 9. Recommended next phase
- Replace demo content with a real backend and AI provider API
- Add onboarding, project history, and content exports
- Introduce native-like animations and deeper personalization
- Support dark/light theme toggling and account sync

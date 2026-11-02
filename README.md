# JobContact AI
*Don't just apply. Find your way in.*

Website (Next.js) + Chrome extension (React, TypeScript, Manifest V3). Both share `packages/shared` (job parsing, people searches, contacts UI, CSV, styles). No database, accounts or paid APIs; contacts live in browser storage.

## Run locally
```
npm install
npm run web          # http://localhost:3000
npm run build:ext    # builds apps/extension/dist
npm test
```

## Deploy the website to Vercel
1. Push this repo to GitHub.
2. In Vercel: Add New > Project, import the repo.
3. Set Root Directory to `apps/web`. Keep "Include source files outside of the Root Directory" enabled (default).
4. Framework is detected as Next.js. Click Deploy. No environment variables needed.

## Load the extension in Chrome
1. `npm install && npm run build:ext`
2. Open `chrome://extensions` and turn on Developer mode.
3. Click Load unpacked and choose `apps/extension/dist`.
4. Open a job posting, click the JobContact AI icon, then Find People.

If a page can't be read automatically, paste the job description into the box.

## Publish to the Chrome Web Store
1. Register as a Chrome Web Store developer (one-time $5 fee).
2. Run `npm run build:ext`, then zip the contents of `apps/extension/dist` (manifest.json at the zip root).
3. Dashboard > Add new item > upload the zip.
4. Fill in the listing: description, at least one 1280x800 screenshot, a 128px icon (replace the placeholder in `apps/extension/public`), category.
5. Privacy tab: single purpose ("find people to contact for a job posting"); justify `activeTab` and `scripting` (read the current job page on click) and `storage` (save contacts locally); state that no user data is collected or sent anywhere; add a privacy policy URL.
6. Submit for review (usually a few days).

## Notes
- The website and extension store contacts separately. Use CSV export to move them.
- Every suggested person is a Google search labeled as a guess. Emails are never marked verified. LinkedIn is never fetched or automated.
- The URL reader can't read JavaScript-rendered pages (many Workday/Comeet pages). Paste the description there, or use the extension, which reads the live page.

# Kamo's AI

Kamo's portfolio: a chat assistant that answers questions about Kamo, plus Projects, CV, Contact, a Data page for
editing the profile the assistant answers from, and a live demo of my API. It runs as one app: React + Vite on the
front end, Express on the server. Suggested GitHub name: `kamo-portfolio`.

## Where this project is now (27 Nov 2026)

**Status: working. Ready to deploy from `main`.**

| | |
|---|---|
| **Works and tested** | All seven tabs (Chat, Projects, CV, Contact, Data, Updates, API) load on phone and desktop with no page errors and no sideways scrolling. The **API** page (status, visit counter, guestbook, code examples) and the **contact form** (emailed, and saved to MasterAPI) pass 11 server checks in production mode against a local MasterAPI. The guestbook rejects bad input and allows 5 posts per visitor every 10 minutes |
| **Not tested** | The **Data** page and admin sign-in (from the 26 Nov redesign), the live Render site with a real MasterAPI address, and real email delivery |
| **Left over, not used** | `browserAI.ts` and `BrowserAIToggle.tsx` (the on-device AI) are no longer shown in the app after the redesign. They can be wired back in or deleted |

**To turn on the API page:** set `MASTERAPI_URL` and `MASTERAPI_KEY` on the Render service. Without them the page says "Not connected" and the rest of the site works as normal.

## My projects

| Project | What it is | Suggested repo name |
| --- | --- | --- |
| This site | Portfolio with an AI chat and a live API demo | `kamo-portfolio` |
| MasterAPI | Shared backend for my apps (data, accounts, settings, counters) | `masterapi` |
| Elysian | Video directory with an admin panel | `elysian-video-site` |
| Household budget | Phone-first money app that syncs through MasterAPI | `household-budget` |
| Portfolio AI backend | RAG chat backend for this site | `portfolio-ai-backend` |
| UJ Cafeteria Stock Manager | Inventory and orders for a cafeteria (prototype) | `uj-cafeteria-stock-manager` |
| Realtime chat | Private one-to-one chat over websockets (prototype) | `realtime-chat-app` |

## Pages

- **Chat** answers from Kamo's profile (`me.json`). Answers come from the server's AI when it is set up, and built-in answers otherwise, so the chat always replies.
- **Projects, CV and Contact.** The contact form emails Kamo and, when MasterAPI is connected, also saves a copy there.
- **Data** edits the profile the assistant uses. It is protected by an admin passcode.
- **Updates** shows the project history (`CHANGELOG.md`).
- **API** is a live demo of MasterAPI: a visit counter and a guestbook stored in it, with copyable examples of how to call it.

## Run locally

```bash
npm install
cp .env.example .env     # optional: the chat works without any keys
npm run dev              # http://localhost:3000
```

Other scripts: `npm run typecheck`, `npm run build`, `npm start` (runs the built server). The server uses the `PORT` variable if it is set, and 3000 otherwise.

## Deploy (Render)

This repo has a `render.yaml`: in Render choose **New → Blueprint** and pick the repo. Or create a Web Service by hand:

- Build command: `npm install --include=dev && npm run build`
- Start command: `npm start`
- Set the variables you need from `.env.example` in Render's **Environment** tab.

## Configuration

See `.env.example` for every variable. The ones the server reads:

| Variable | Purpose |
| --- | --- |
| `APP_URL` | Public address of the site |
| `ALLOWED_ORIGINS` | Other websites allowed to call this server (the site's own address is always allowed) |
| `OPENROUTER_API_KEY` / `GEMINI_API_KEY` | Server-side AI (optional) |
| `RENDER_BACKEND_URL` | Address of the portfolio AI backend (`kamo-portfolio-ai`), used as a chat fallback (optional) |
| `SMTP_*`, `CONTACT_RECIPIENT_EMAIL` | Email for the contact form (optional) |
| `ADMIN_PASSCODE`, `SESSION_SECRET` | Admin sign-in for the Data page |
| `MASTERAPI_URL` + `MASTERAPI_KEY` | Address and app key of MasterAPI. Turns on the API page and saves contact messages there (optional; the key stays on the server) |

Keys belong only in the server's environment. Nothing that starts with `VITE_` should be secret, because the browser can read it.

## Project layout

```
src/components/  the pages (Chat, Projects, CV, Contact, ProfileData, Changelog, Api) and the bottom navigation
src/lib/         aiClient.ts, assistantEngine.ts, serverReadiness.ts, browserAI.ts (not used)
server.ts        Express API: health, chat, contact, admin sign-in, profile and the MasterAPI demo routes
masterapi.ts     Server-side client for MasterAPI
me.json          Kamo's profile, used by the assistant
render.yaml      Render Blueprint
CHANGELOG.md     Project history
```

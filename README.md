# Kamo's AI

Kamo's portfolio: a chat assistant that answers questions about Kamo, an AI calendar, the projects,
CV and contact pages. It runs as one app: React + Vite on the front end, Express on the server.

## Where this project is now (27 Nov 2026)

**Status: working, with the new My API page waiting to be merged and deployed.** Suggested GitHub name: `kamo-portfolio`.

| | |
|---|---|
| **Works and tested** | Chat with built-in answers, calendar that saves in the browser, Projects / CV / Contact pages, the My API page (status, visit counter, guestbook, code examples), goals and contact messages saved to MasterAPI. Checked on phone and desktop with no page errors |
| **Tested against** | A local MasterAPI. The guestbook rejects bad input and allows 5 posts per visitor every 10 minutes |
| **Not verified** | The live Render site with a real MasterAPI address; the on-device AI model download (needs a WebGPU browser); email delivery |
| **On the development branch, not yet in `main`** | Touch-ups to the chat and layout, saving to MasterAPI, and the My API page |

**To turn on the My API page:** set `MASTERAPI_URL` and `MASTERAPI_KEY` on the Render service.

## My projects

| Project | What it is | Suggested repo name |
| --- | --- | --- |
| This site | Portfolio with an AI chat, calendar and a live API demo | `kamo-portfolio` |
| MasterAPI | Shared backend for my apps (data, accounts, settings, counters) | `masterapi` |
| Elysian | Video directory with an admin panel | `elysian-video-site` |
| Household budget | Phone-first money app that syncs through MasterAPI | `household-budget` |
| Portfolio AI backend | RAG chat backend for this site | `portfolio-ai-backend` |
| UJ Cafeteria Stock Manager | Inventory and orders for a cafeteria (prototype) | `uj-cafeteria-stock-manager` |
| Realtime chat | Private one-to-one chat over websockets (prototype) | `realtime-chat-app` |

## Features

- **Chat** answers from Kamo's profile (`me.json`). Answers come from, in order: the on-device model
  (if switched on), the server, then built-in answers, so the chat always replies.
- **Run AI in browser:** an optional on-device model (WebLLM, Qwen2.5 0.5B, about 400 MB, downloaded
  once and cached). Needs WebGPU (recent Chrome or Edge). Nothing you type leaves the device while it's on.
- **Calendar:** private notes and AI "Smart Add" (type "Call John next Friday"). Notes are saved in
  your browser, so they survive reloads and redeploys. Use the download and upload buttons to back them up.
- **My API:** a live demo of MasterAPI, my shared backend. A visit counter and a guestbook are stored in it,
  with copyable examples of how to call it. Needs `MASTERAPI_URL` and `MASTERAPI_KEY`.
- **Projects, CV and contact** pages, with a responsive layout for phones and desktop.

## Run locally

```bash
npm install
cp .env.example .env     # optional: the chat works without any keys
npm run dev              # http://localhost:3000
```

Other scripts: `npm run typecheck`, `npm run build`, `npm start` (runs the built server).

## Deploy (Render)

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Set the variables you need from `.env.example` in Render's **Environment** tab. `PORT` is set by Render.

Server-side AI and email are optional. Without them the chat uses the built-in answers and the
contact form is disabled.

## Configuration

See `.env.example` for every variable and what it does. The important ones:

| Variable | Purpose |
| --- | --- |
| `APP_URL` | Public address of the site |
| `OPENROUTER_API_KEY` / `GEMINI_API_KEY` | Server-side AI (optional) |
| `DATABASE_URL` | PostgreSQL for planner data (optional) |
| `API_WRITE_KEY` + `VITE_API_WRITE_KEY` | Shared secret protecting write routes |
| `SMTP_*` | Email for the contact form (optional) |
| `MASTERAPI_URL` + `MASTERAPI_KEY` | Address and app key of MasterAPI. Enables the My API page and saves goals and contact messages there (optional; the key stays on the server) |
| `RENDER_BACKEND_URL` | Address of the portfolio AI backend (`kamo-portfolio-ai`), used as a chat fallback (optional) |

Keys belong only in the server's environment. Nothing that starts with `VITE_` should be secret,
because the browser can read it.

## Project layout

```
src/            React app: chat, calendar, projects, CV and contact pages
src/lib/        browserAI.ts (on-device model), plannerStorage.ts (local calendar), smartAdd.ts, aiClient.ts
server.ts       Express API: health, chat, contact, goals, planner and MasterAPI demo routes
masterapi.ts    Server-side client for MasterAPI
plannerRouter.ts  Planner notes storage
me.json         Kamo's profile, used by the assistant
CHANGELOG.md    Project history
```

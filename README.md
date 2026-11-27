# Kamo's AI

Kamo's portfolio: a chat assistant that answers questions about Kamo, an AI calendar, the projects,
CV and contact pages. It runs as one app: React + Vite on the front end, Express on the server.

## Features

- **Chat** answers from Kamo's profile (`me.json`). Answers come from, in order: the on-device model
  (if switched on), the server, then built-in answers, so the chat always replies.
- **Run AI in browser:** an optional on-device model (WebLLM, Qwen2.5 0.5B, about 400 MB, downloaded
  once and cached). Needs WebGPU (recent Chrome or Edge). Nothing you type leaves the device while it's on.
- **Calendar:** private notes and AI "Smart Add" (type "Call John next Friday"). Notes are saved in
  your browser, so they survive reloads and redeploys. Use the download and upload buttons to back them up.
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

Keys belong only in the server's environment. Nothing that starts with `VITE_` should be secret,
because the browser can read it.

## Project layout

```
src/            React app: chat, calendar, projects, CV and contact pages
src/lib/        browserAI.ts (on-device model), plannerStorage.ts (local calendar), smartAdd.ts, aiClient.ts
server.ts       Express API: health, chat, contact, planner routes
plannerRouter.ts  Planner notes storage
me.json         Kamo's profile, used by the assistant
CHANGELOG.md    Project history
```

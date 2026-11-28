# Kamo's AI

Kamo's portfolio: a chat assistant that answers questions about Kamo, plus Projects, CV, Contact, a Data page for
editing the profile the assistant answers from, and a live demo of my API. It runs as one app: React + Vite on the
front end, Express on the server. Suggested GitHub name: `kamo-portfolio`.

## Where this project is now (27 Nov 2026)

**Status: working. Ready to deploy from `main`. All of its server-side services come from MasterAPI.**

| | |
|---|---|
| **Works and tested** | **Chat** on phone and desktop through the real chain (page → this server → MasterAPI → model): suggestions, typed follow-ups with memory, bold text and project cards, a built-in answer when the AI is down, a clear message and Retry when the server drops, Clear, and the floating menu. **Contact form**: saved and emailed, still succeeds if the email provider fails. **Profile and admin passcode** survive a redeploy (checked by wiping the server's files and restarting). If MasterAPI is unreachable at start-up, the admin routes stay closed until it answers. All tested against a local MasterAPI v3 with stand-ins for Hugging Face and the email provider |
| **Not tested** | The chat against the **real Hugging Face service** and the **real email provider** (neither can be reached from the build environment), the Data page screens themselves, and the live Render site |
| **Note** | The project cards in the chat come from the profile on the **Data** page. They currently list older projects: edit them there |
**To connect everything:** set `MASTERAPI_URL` and `MASTERAPI_KEY` on the Render service (the MasterAPI console shows both lines when you create an app). On MasterAPI itself, set `HF_TOKEN` for the AI and `RESEND_API_KEY` + `MAIL_TO` for email. Without the connection the site still works: the chat uses built-in answers and the API page says "Not connected".
**Also set `ADMIN_PASSCODE`** on the Render service. If it is empty, the first person to open the Data page can claim it.

## My projects

| Project | What it is | Suggested repo name |
| --- | --- | --- |
| This site | Portfolio with an AI chat and a live API demo | `kamo-portfolio` |
| MasterAPI | Shared backend for my apps (data, accounts, settings, counters) | `masterapi` |
| Elysian | Video directory with an admin panel | `elysian-video-site` |
| Household budget | Phone-first money app that syncs through MasterAPI | `household-budget` |
| Portfolio AI backend | Separate RAG chat backend (Hugging Face + Pinecone). This site's chat no longer uses it | `portfolio-ai-backend` |
| UJ Cafeteria Stock Manager | Inventory and orders for a cafeteria (prototype) | `uj-cafeteria-stock-manager` |
| Realtime chat | Private one-to-one chat over websockets (prototype) | `realtime-chat-app` |

## Pages

- **Chat** answers from Kamo's profile using small open models on **Hugging Face**, reached through MasterAPI's AI service (`Qwen/Qwen2.5-7B-Instruct`, then `meta-llama/Llama-3.2-3B-Instruct`; MasterAPI's `HF_MODEL` picks your own first). It remembers the last few turns. If MasterAPI is asleep, down, or no model can answer, it answers from built-in knowledge, so the chat always replies.
- **Navigation** is a floating pill at the bottom. Tap the menu button and it grows upward into every page.
- **Projects, CV and Contact.** The contact form goes to MasterAPI, which saves the message and emails Kamo. Without MasterAPI it falls back to direct SMTP email.
- **Data** edits the profile the assistant uses. It is protected by an admin passcode. With MasterAPI connected, the profile and passcode are saved there, so they survive redeploys.
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
| `GEMINI_API_KEY` | Voice input in the chat only (optional) |
| `SMTP_*`, `CONTACT_RECIPIENT_EMAIL` | Direct email for the contact form, used only when MasterAPI is not connected (optional) |
| `ADMIN_PASSCODE`, `SESSION_SECRET` | Admin sign-in for the Data page |
| `MASTERAPI_URL` + `MASTERAPI_KEY` | Address and app key of MasterAPI: turns on the AI chat, contact mail, saved profile and the API page (optional; the key stays on the server) |

Keys belong only in the server's environment. Nothing that starts with `VITE_` should be secret, because the browser can read it.

## Project layout

```
src/components/  the pages (Chat, Projects, CV, Contact, ProfileData, Changelog, Api) and the bottom navigation
src/lib/         assistantEngine.ts (built-in answers), serverReadiness.ts, aiClient.ts and browserAI.ts (not used)
server.ts        Express API: health, chat, contact, admin sign-in, profile and the MasterAPI demo routes
masterapi.ts     Server-side client for MasterAPI (chat, mail, saved settings, counters)
me.json          Kamo's profile, used by the assistant
render.yaml      Render Blueprint
CHANGELOG.md     Project history
```

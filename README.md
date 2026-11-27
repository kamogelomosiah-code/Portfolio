# Kamo's AI

Kamo's portfolio: a chat assistant that answers questions about Kamo, plus Projects, CV, Contact, a Data page for
editing the profile the assistant answers from, and a live demo of my API. It runs as one app: React + Vite on the
front end, Express on the server. Suggested GitHub name: `kamo-portfolio`.

## Where this project is now (27 Nov 2026)

**Status: working. Ready to deploy from `main`.**

| | |
|---|---|
| **Works and tested** | The **floating menu** (a pill that grows upward into all seven pages) on phone and desktop, with every page reachable and no sideways scrolling. The **chat** through a stand-in for Hugging Face's API: it sends the token, the profile and the last few turns, tries the next model when one fails, and falls back to built-in answers when Hugging Face is missing, down, slow or refuses the token. The **API** page and the **contact form** (emailed, and saved to MasterAPI) |
| **Not tested** | The chat against the **real Hugging Face service** (it could not be reached from the build environment, so check which models your token can use), the **Data** page and admin sign-in, the live Render site, and real email delivery |
| **Left over, not used** | `browserAI.ts` and `BrowserAIToggle.tsx` (the on-device AI) are no longer shown in the app after the redesign. They can be wired back in or deleted |

**To turn on the chat AI:** set `HF_TOKEN` (a Hugging Face token) on the Render service. Without it the chat still answers, from built-in knowledge.
**To turn on the API page:** set `MASTERAPI_URL` and `MASTERAPI_KEY`. Without them the page says "Not connected" and the rest of the site works as normal.

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

- **Chat** answers from Kamo's profile (`me.json`) using small open models on **Hugging Face**: `Qwen/Qwen2.5-7B-Instruct`, then `meta-llama/Llama-3.2-3B-Instruct` if that one fails (set `HF_MODEL` to try your own first). It remembers the last few turns. If `HF_TOKEN` is missing or Hugging Face is unavailable, it answers from built-in knowledge, so the chat always replies.
- **Navigation** is a floating pill at the bottom. Tap the menu button and it grows upward into every page.
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
| `HF_TOKEN` | Hugging Face token for the chat AI (optional; without it the chat uses built-in answers) |
| `HF_MODEL` | A Hugging Face model to try first (optional) |
| `GEMINI_API_KEY` | Voice input in the chat only (optional) |
| `SMTP_*`, `CONTACT_RECIPIENT_EMAIL` | Email for the contact form (optional) |
| `ADMIN_PASSCODE`, `SESSION_SECRET` | Admin sign-in for the Data page |
| `MASTERAPI_URL` + `MASTERAPI_KEY` | Address and app key of MasterAPI. Turns on the API page and saves contact messages there (optional; the key stays on the server) |

Keys belong only in the server's environment. Nothing that starts with `VITE_` should be secret, because the browser can read it.

## Project layout

```
src/components/  the pages (Chat, Projects, CV, Contact, ProfileData, Changelog, Api) and the bottom navigation
src/lib/         assistantEngine.ts (built-in answers), serverReadiness.ts, aiClient.ts and browserAI.ts (not used)
server.ts        Express API: health, chat (Hugging Face), contact, admin sign-in, profile and the MasterAPI demo routes
masterapi.ts     Server-side client for MasterAPI
me.json          Kamo's profile, used by the assistant
render.yaml      Render Blueprint
CHANGELOG.md     Project history
```

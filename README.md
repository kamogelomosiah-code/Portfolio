# CodeMind Assistant

A full-stack, AI-powered web application utilizing Hugging Face's Inference Providers API. 

The application has two modes:
1. **Quick Mode**: A fast, single-model call for general questions.
2. **Think Longer Mode**: An orchestrated, multi-step backend process that uses multiple models (Reasoning, Code Generation, and optionally Live Search) to synthesize a highly accurate and structured answer.

## Deployment on Render

This project is structured as a full-stack Node.js + Express backend with a React (Vite) frontend, designed to be deployed easily on [Render](https://render.com).

### Instructions

1. **Push your code to a GitHub repository.**
2. **Create a new "Web Service" on Render.**
3. **Connect your GitHub repository.**
4. **Configure the deployment settings:**
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
5. **Add Environment Variables in Render's Dashboard:**
   - `HF_TOKEN`: Your Hugging Face access token with Serverless Inference rights.
   - `SEARCH_API_KEY`: (Optional) Your Tavily or Serper API key to enable live web search in "Think Longer" mode.
6. **Deploy.**

Render will automatically handle compiling the React application via Vite and spinning up the compiled Node `dist/server.cjs` backend. 

### Security Note
The `HF_TOKEN` and `SEARCH_API_KEY` are kept securely on the server side and are never exposed to the frontend browser. All model inference and orchestration occur on the backend Express application.

## Browser AI (on-device)

The chat header has a **Run AI in browser** button. It downloads a small model
(`Qwen2.5-0.5B-Instruct`, ~400 MB, cached after the first time) via
[WebLLM](https://github.com/mlc-ai/web-llm) and runs it on the visitor's GPU with
WebGPU — no server or API key. When it's on, chat replies and the calendar's
**AI Smart Add** are generated on-device; otherwise the app uses the server and
then the built-in offline replies. Needs a WebGPU browser (recent Chrome/Edge,
Safari 26+); other browsers simply don't show it as available.

## Calendar storage

Calendar notes are saved in the browser's `localStorage` (key
`kamo_planner_notes_v1`), so they persist across reloads and server redeploys
without any API key. Use the download / upload buttons in the calendar header to
back up notes or move them to another device. Notes previously stored in
`planner_notes.json` on the server are imported automatically on first load.

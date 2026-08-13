# Changelog

All notable changes to the **CodeMind Assistant (Kamo AI Portfolio & Chatbot)** platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.7.0] - 2026-08-13

### Changed & Simplified
- Redesigned and simplified the Planner into a clean **Calendar with Notes**:
  - Implemented monthly calendar grid with month navigation and date selection.
  - Added full note CRUD functionality (add, edit, delete) for any selected date.
  - Created `/planner_notes.json` at the project root for local file persistence.
  - Added backend API endpoints (`GET /api/planner/notes` and `POST /api/planner/notes`) to read and write directly to `planner_notes.json`.
  - Notes automatically persist across page refreshes and application restarts.

## [1.6.0] - 2026-08-13

### Removed
- Removed the Support Assistant section, `/api/support/search` API endpoint, and support tab navigation options across desktop Sidebar and mobile Menu Drawer.

### Fixed & Improved
- Fixed chat user message bubble overflow and text wrapping (`word-break`) behavior in `ChatInterface.tsx`.
- Added dynamic real-time token estimator (`~N tokens`) alongside character counter in the chat input toolbar.
- Enforced system dark mode and updated navigation drawer and sidebar state types.

## [1.5.1] - 2026-07-20

### Fixed
- Restored and fixed the Cloud AI API calling routes by pointing client queries directly to the server's native `/api/chat` orchestration backend.
- Resolved external 503/offline errors from third-party hosting services by mapping the frontend models to the robust server-side multi-model orchestration pipeline (`fusion` for Think Longer mode and `swift` for Quick mode).
- Rewrote the `useLocalLLM` custom hook to leverage the `/api/hf-health` endpoint for accurate model status detection and to proxy requests securely to `/api/chat`.

## [1.5.0] - 2026-07-19

### Changed
- Integrated custom `useLocalLLM` React hook into the application's root state for handling remote Model LLM connections.
- Dynamically disable the "Enable Thinking" (Large Model) toggle via `/status` polling to ensure it is only accessible when the model is fully loaded.
- Updated the API URLs to dynamically respect the `VITE_LLM_API_URL` environment variable for seamless deployment across frontend/backend boundaries.
- Relocated the AI Engine toggle panel to a unified "Settings" modal for a cleaner Chat Interface.
- Updated the backend Python server (`app.py`) to utilize `llama-cpp-python` with a CPU-friendly GGUF quantized model for the large model inference path.
- Updated the model naming identifiers from `fusion` to `large` to better reflect the new backend structure.

### Fixed
- Fixed the text color visibility of the portfolio project descriptions in Dark Theme so they correctly render in white.

### Added
- Added brief, descriptive explanatory tooltips for "Cloud Core" and "Local WebAI" engine modes in the Settings modal to help user understanding.

## [1.4.0] - 2026-07-05
### Added
- Created an interactive, responsive in-app **System Changelog & Version History** timeline view (`src/components/ChangelogPage.tsx`).
- Created a markdown-based `CHANGELOG.md` file in the project's root folder for file-system iteration tracking.
### Improved
- Integrated the update log view across the desktop Sidebar, the mobile Menu Drawer, and primary routing logic.

## [1.3.0] - 2026-07-05
### Fixed
- Harmonized theme background-colors globally (removed persistent dark background styles in light-theme containers inside Sidebar, Menu Drawer, and action buttons).
### Improved
- Constrained the AI model's generation text to be concise and safe for Render's 512 MB GGUF/memory execution limits.
- Restricted emoji count to a maximum of 1 or 2 per response for clean, elite corporate readability.

## [1.2.0] - 2026-07-04
### Fixed
- Swapped custom system launch icon to a beautifully rendered psychological vector Material icon (fixed Watermelon design).
- Uniformed desktop/mobile buttons layout spacing, interactive shadow profiles, and hover transitions.
### Improved
- Removed legacy, unused file and module references to ensure error-free builds and clean linter logs.

## [1.1.0] - 2026-07-03
### Added
- Created "Think Longer Mode" utilizing multi-model voting orchestration through Hugging Face's inference endpoints.
- Integrated Google Calendar scheduling via Express endpoint API route proxies.
- Added CV & Resume PDF renderer and Project Portfolio card components.

## [1.0.0] - 2026-07-01
### Added
- Set up React 19 + TypeScript + Express backend skeleton built specifically for Render Web Services deployment.
- Created standard sidebar navigation and slide-out mobile drawer components.

# Changelog

All notable changes to the **CodeMind Assistant (Kamo AI Portfolio & Chatbot)** platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.5.0] - 2026-07-19

### Changed
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

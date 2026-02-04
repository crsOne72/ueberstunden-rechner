# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dual-platform overtime calculator ("Überstundenrechner") for tracking daily work hours. The UI is in German.

- **Chrome Extension**: Original implementation in root directory (`popup.html`, `popup.js`, `styles.css`)
- **PWA**: Progressive Web App in `docs/` directory (hosted via GitHub Pages)

## Tech Stack

- **Vanilla JavaScript**: No frameworks, single-file architecture
- **CSS**: Glassmorphism design with animations
- **PWA**: Service Worker for offline support, Web App Manifest for installation

## Architecture

### Chrome Extension (root)
- `popup.html` / `popup.js` / `styles.css`
- Uses `chrome.storage.local` for persistence

### PWA (docs/)
- `docs/index.html` / `docs/app.js` / `docs/styles.css`
- `docs/sw.js` - Service Worker for offline caching
- `docs/manifest.json` - PWA manifest
- **Storage Abstraction Layer** (`docs/app.js:1-110`): Unified API supporting Chrome storage and localStorage fallback

### Key Data Structures

```javascript
settings = { targetMinutes: 480, breakMinutes: 60 }  // Default: 8h work, 1h break
entries = [{ id, date, startTime, endTime, breakMinutes, workedMinutes, diffMinutes }]
timerState = { isRunning, isPaused, startTimestamp, pauseStartTimestamp, totalPausedMs }
```

## Commands

```bash
# Install dependencies
npm install

# Generate PWA icons
node generate-icons.js

# Local testing
npx serve docs
```

## Development

### Chrome Extension
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select root directory
4. Reload extension after changes

### PWA
1. Edit files in `docs/`
2. Test locally with `npx serve docs`
3. Push to GitHub - GitHub Pages auto-deploys

### Testing
Manual testing only. Both platforms gracefully handle missing storage APIs with console warnings.

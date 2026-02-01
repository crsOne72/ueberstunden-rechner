# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dual-platform overtime calculator ("Überstundenrechner") for tracking daily work hours. The UI is in German.

- **Chrome Extension**: Original implementation in root directory (`popup.html`, `popup.js`, `styles.css`)
- **Mobile App**: Capacitor-based iOS/Android app in `www/` directory

## Tech Stack

- **Vanilla JavaScript**: No frameworks, single-file architecture
- **CSS**: Glassmorphism design with animations
- **Capacitor 6**: Native iOS/Android wrapper
- **Capacitor Plugins**: `@capacitor/preferences` (storage), `@capacitor/dialog` (native dialogs)

## Architecture

### Chrome Extension (root)
- `popup.html` / `popup.js` / `styles.css`
- Uses `chrome.storage.local` for persistence

### Mobile App (www/)
- `www/index.html` / `www/app.js` / `www/styles.css`
- **Storage Abstraction Layer** (`www/app.js:1-110`): Unified API supporting Capacitor Preferences, Chrome storage, and localStorage fallback
- Native projects in `android/` and `ios/`

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

# Sync web assets to native projects (after changes to www/)
npm run sync

# Open in Android Studio
npm run open:android

# Open in Xcode (macOS only)
npm run open:ios

# Run on connected device/emulator
npm run run:android
npm run run:ios
```

## Development

### Chrome Extension
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select root directory
4. Reload extension after changes

### Mobile App
1. Edit files in `www/`
2. Run `npm run sync` to copy to native projects
3. Build/run via Android Studio or Xcode

### Testing
Manual testing only. Both platforms gracefully handle missing storage APIs with console warnings.

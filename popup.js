// State
let elements = {};
let settings = {
  targetMinutes: 480,
  breakMinutes: 60
};
let entries = [];
let timerState = {
  isRunning: false,
  isPaused: false,
  startTimestamp: null,
  pauseStartTimestamp: null,
  totalPausedMs: 0
};
let clockInterval = null;
let timerInterval = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

async function init() {
  applyDailyTheme();
  initElements();
  await loadData();
  setupEventListeners();
  startClock();
  setDefaultDate();
  renderEntries();
  updateTotalBalance();
  updateEndTimeDisplay();
  restoreTimerState();
  updateEntrySummary();
}

function applyDailyTheme() {
  const themes = [
    // Sonntag - Warm Sunset
    { bg1: '#f97316', bg2: '#e11d48', bg3: '#fbbf24' },
    // Montag - Ocean Blue
    { bg1: '#667eea', bg2: '#764ba2', bg3: '#f093fb' },
    // Dienstag - Teal Dream
    { bg1: '#0ea5e9', bg2: '#6366f1', bg3: '#a78bfa' },
    // Mittwoch - Emerald Forest
    { bg1: '#059669', bg2: '#0d9488', bg3: '#06b6d4' },
    // Donnerstag - Amber Glow
    { bg1: '#d97706', bg2: '#ea580c', bg3: '#fbbf24' },
    // Freitag - Pink Party
    { bg1: '#ec4899', bg2: '#8b5cf6', bg3: '#6366f1' },
    // Samstag - Deep Night
    { bg1: '#4f46e5', bg2: '#7c3aed', bg3: '#a855f7' },
  ];

  const day = new Date().getDay();
  const theme = themes[day];
  const root = document.documentElement;
  root.style.setProperty('--bg-1', theme.bg1);
  root.style.setProperty('--bg-2', theme.bg2);
  root.style.setProperty('--bg-3', theme.bg3);
}

function initElements() {
  elements = {
    totalBalance: document.getElementById('totalBalance'),
    toggleSettings: document.getElementById('toggleSettings'),
    settingsPanel: document.getElementById('settingsPanel'),
    targetHours: document.getElementById('targetHours'),
    targetMinutes: document.getElementById('targetMinutes'),
    breakHours: document.getElementById('breakHours'),
    breakMins: document.getElementById('breakMins'),
    saveSettings: document.getElementById('saveSettings'),
    entryDate: document.getElementById('entryDate'),
    startTime: document.getElementById('startTime'),
    endTime: document.getElementById('endTime'),
    addEntry: document.getElementById('addEntry'),
    entriesList: document.getElementById('entriesList'),
    clearHistory: document.getElementById('clearHistory'),
    currentDate: document.getElementById('currentDate'),
    currentTime: document.getElementById('currentTime'),
    timerValue: document.getElementById('timerValue'),
    timerToggle: document.getElementById('timerToggle'),
    pauseToggle: document.getElementById('pauseToggle'),
    manualStartTime: document.getElementById('manualStartTime'),
    timerDisplay: document.getElementById('timerDisplay'),
    timerStatus: document.getElementById('timerStatus'),
    startTimeInput: document.getElementById('startTimeInput'),
    progressFill: document.getElementById('progressFill'),
    progressPercent: document.getElementById('progressPercent'),
    remainingTime: document.getElementById('remainingTime'),
    endTimeDisplay: document.getElementById('endTimeDisplay'),
    endTimeValue: document.getElementById('endTimeValue'),
    endTimeNote: document.getElementById('endTimeNote'),
    pauseInfo: document.getElementById('pauseInfo'),
    pauseDuration: document.getElementById('pauseDuration'),
    summaryDate: document.getElementById('summaryDate'),
    summaryTimes: document.getElementById('summaryTimes'),
    summaryWorked: document.getElementById('summaryWorked'),
    summaryDiff: document.getElementById('summaryDiff'),
    entrySection: document.getElementById('entrySection')
  };
}

// Data persistence
async function loadData() {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      console.warn('Chrome storage not available');
      resolve();
      return;
    }

    chrome.storage.local.get(['settings', 'entries', 'timerState'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error loading data:', chrome.runtime.lastError);
        resolve();
        return;
      }

      if (result.settings) {
        settings = {
          targetMinutes: result.settings.targetMinutes || 480,
          breakMinutes: result.settings.breakMinutes !== undefined ? result.settings.breakMinutes : 60
        };
      }

      if (result.entries && Array.isArray(result.entries)) {
        entries = result.entries;
      }

      if (result.timerState) {
        timerState = {
          isRunning: Boolean(result.timerState.isRunning),
          isPaused: Boolean(result.timerState.isPaused),
          startTimestamp: result.timerState.startTimestamp || null,
          pauseStartTimestamp: result.timerState.pauseStartTimestamp || null,
          totalPausedMs: Number(result.timerState.totalPausedMs) || 0
        };
      }

      // Update UI with loaded settings
      if (elements.targetHours) {
        elements.targetHours.value = Math.floor(settings.targetMinutes / 60);
      }
      if (elements.targetMinutes) {
        elements.targetMinutes.value = settings.targetMinutes % 60;
      }
      if (elements.breakHours) {
        elements.breakHours.value = Math.floor(settings.breakMinutes / 60);
      }
      if (elements.breakMins) {
        elements.breakMins.value = settings.breakMinutes % 60;
      }

      resolve();
    });
  });
}

async function saveData() {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      console.warn('Chrome storage not available');
      resolve();
      return;
    }

    const dataToSave = {
      settings: {
        targetMinutes: settings.targetMinutes,
        breakMinutes: settings.breakMinutes
      },
      entries: entries,
      timerState: {
        isRunning: timerState.isRunning,
        isPaused: timerState.isPaused,
        startTimestamp: timerState.startTimestamp,
        pauseStartTimestamp: timerState.pauseStartTimestamp,
        totalPausedMs: timerState.totalPausedMs
      }
    };

    chrome.storage.local.set(dataToSave, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving data:', chrome.runtime.lastError);
      }
      resolve();
    });
  });
}

function setDefaultDate() {
  const today = OvertimeUtils.formatDateKey(new Date());
  if (elements.entryDate) {
    elements.entryDate.value = today;
  }
}

// Event Listeners
function setupEventListeners() {
  if (elements.toggleSettings) {
    elements.toggleSettings.addEventListener('click', toggleSettings);
  }
  if (elements.saveSettings) {
    elements.saveSettings.addEventListener('click', handleSaveSettings);
  }
  if (elements.addEntry) {
    elements.addEntry.addEventListener('click', handleAddEntry);
  }
  if (elements.clearHistory) {
    elements.clearHistory.addEventListener('click', handleClearHistory);
  }
  if (elements.timerToggle) {
    elements.timerToggle.addEventListener('click', toggleTimer);
  }
  if (elements.pauseToggle) {
    elements.pauseToggle.addEventListener('click', togglePause);
  }
  if (elements.manualStartTime) {
    elements.manualStartTime.addEventListener('change', onManualStartTimeChange);
  }
}

function toggleSettings() {
  if (elements.settingsPanel) {
    elements.settingsPanel.classList.toggle('hidden');
  }
}

async function handleSaveSettings() {
  const hours = parseInt(elements.targetHours.value) || 0;
  const minutes = parseInt(elements.targetMinutes.value) || 0;
  settings.targetMinutes = hours * 60 + minutes;

  const breakHours = parseInt(elements.breakHours.value) || 0;
  const breakMins = parseInt(elements.breakMins.value) || 0;
  settings.breakMinutes = breakHours * 60 + breakMins;

  await saveData();
  updateTotalBalance();
  updateEndTimeDisplay();

  if (elements.settingsPanel) {
    elements.settingsPanel.classList.add('hidden');
  }
}

// Time Helper Functions
function parseTime(timeString) {
  if (!timeString || typeof timeString !== 'string') return 0;
  const parts = timeString.split(':');
  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;
  return hours * 60 + minutes;
}

function formatMinutes(totalMinutes) {
  if (typeof totalMinutes !== 'number' || isNaN(totalMinutes)) {
    return '0:00';
  }
  const sign = totalMinutes < 0 ? '-' : '+';
  const absMinutes = Math.abs(totalMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  if (totalMinutes === 0) return '0:00';
  return `${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
}

function formatMinutesSimple(totalMinutes) {
  if (typeof totalMinutes !== 'number' || isNaN(totalMinutes)) {
    return '00:00';
  }
  const absMinutes = Math.abs(Math.floor(totalMinutes));
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function formatTime(hours, minutes) {
  const h = Math.floor(hours) || 0;
  const m = Math.floor(minutes) || 0;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function formatSeconds(totalSeconds) {
  if (typeof totalSeconds !== 'number' || isNaN(totalSeconds)) {
    return '0:00:00';
  }
  totalSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function calculateGrossMinutes(startTime, endTime) {
  return OvertimeUtils.calculateGrossMinutes(startTime, endTime);
}

function calculateBreakMinutes(grossWorkedMinutes, extraPauseMinutes = 0) {
  return OvertimeUtils.calculateBreakMinutes(
    grossWorkedMinutes,
    OvertimeUtils.MANDATORY_BREAK_MINUTES,
    extraPauseMinutes,
    OvertimeUtils.MANDATORY_BREAK_THRESHOLD_MINUTES
  );
}

function calculateWorkedMinutes(startTime, endTime, breakMinutes) {
  return OvertimeUtils.calculateWorkedMinutes(startTime, endTime, breakMinutes);
}

function calculateDifference(workedMinutes) {
  return workedMinutes - settings.targetMinutes;
}

function isOvernightShift(startTime, endTime) {
  return OvertimeUtils.isOvernightShift(startTime, endTime);
}

function getTotalPauseMs(includeOngoingPause = true) {
  let totalPauseMs = timerState.totalPausedMs || 0;
  if (includeOngoingPause && timerState.isPaused && timerState.pauseStartTimestamp) {
    totalPauseMs += Date.now() - timerState.pauseStartTimestamp;
  }
  return totalPauseMs;
}

function getLiveWorkComputation(nowTimestamp = Date.now()) {
  if (!timerState.startTimestamp) {
    return null;
  }

  const manualBreakMinutes = Math.floor(getTotalPauseMs(true) / 60000);
  return OvertimeUtils.calculateLiveWorkBalance({
    workStart: timerState.startTimestamp,
    now: nowTimestamp,
    dailyTargetMinutes: settings.targetMinutes || 0,
    manualBreakMinutes
  });
}

// Entry Management
async function handleAddEntry() {
  const date = elements.entryDate ? elements.entryDate.value : '';
  const startTime = elements.startTime ? elements.startTime.value : '';
  const endTime = elements.endTime ? elements.endTime.value : '';

  if (!date || !startTime || !endTime) {
    return;
  }

  const extraPauseMinutes = Math.floor((timerState.totalPausedMs || 0) / 60000);
  const grossWorked = calculateGrossMinutes(startTime, endTime);
  const breakMinutes = calculateBreakMinutes(grossWorked, extraPauseMinutes);
  const worked = calculateWorkedMinutes(startTime, endTime, breakMinutes);
  const diff = calculateDifference(worked);

  const entry = {
    id: Date.now(),
    date,
    startTime,
    endTime,
    breakMinutes,
    workedMinutes: worked,
    diffMinutes: diff
  };

  const existingIndex = entries.findIndex(e => e.date === date);
  if (existingIndex !== -1) {
    if (confirm('Es gibt bereits einen Eintrag für dieses Datum. Überschreiben?')) {
      entries[existingIndex] = entry;
    } else {
      return;
    }
  } else {
    entries.unshift(entry);
  }

  entries.sort((a, b) => String(b.date).localeCompare(String(a.date)));

  await saveData();
  renderEntries();
  updateTotalBalance();
  resetTimerState();

  // Move to next day
  if (elements.entryDate) {
    elements.entryDate.value = OvertimeUtils.addDaysToDateKey(date, 1);
  }
}

async function deleteEntry(id) {
  entries = entries.filter(e => e.id !== id);
  await saveData();
  renderEntries();
  updateTotalBalance();
}

async function handleClearHistory() {
  if (confirm('Alle Einträge wirklich löschen?')) {
    entries = [];
    await saveData();
    renderEntries();
    updateTotalBalance();
  }
}

// Rendering
function renderEntries() {
  if (!elements.entriesList) return;

  if (entries.length === 0) {
    elements.entriesList.innerHTML = '<p class="empty-message">Noch keine Einträge vorhanden.</p>';
    return;
  }

  const html = entries.map(entry => {
    const diffClass = entry.diffMinutes > 0 ? 'positive' : entry.diffMinutes < 0 ? 'negative' : 'neutral';
    const formattedDate = formatDate(entry.date);

    return `
      <div class="entry-item" data-id="${entry.id}">
        <div class="entry-info">
          <div class="entry-date">${formattedDate}</div>
          <div class="entry-times">${entry.startTime} - ${entry.endTime}${isOvernightShift(entry.startTime, entry.endTime) ? ' (+1 Tag)' : ''}</div>
        </div>
        <span class="entry-diff ${diffClass}">${formatMinutes(entry.diffMinutes)}</span>
        <button class="delete-btn" data-id="${entry.id}" title="Löschen">&times;</button>
      </div>
    `;
  }).join('');

  elements.entriesList.innerHTML = html;

  elements.entriesList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.dataset.id);
      if (!isNaN(id)) {
        deleteEntry(id);
      }
    });
  });
}

function formatDate(dateString) {
  return OvertimeUtils.formatDateForDisplay(dateString, 'de-DE');
}

function updateTotalBalance() {
  if (!elements.totalBalance) return;

  const total = entries.reduce((sum, entry) => {
    const diff = Number(entry.diffMinutes) || 0;
    return sum + diff;
  }, 0);

  elements.totalBalance.textContent = formatMinutes(total);
  elements.totalBalance.classList.remove('positive', 'negative');

  if (total > 0) {
    elements.totalBalance.classList.add('positive');
  } else if (total < 0) {
    elements.totalBalance.classList.add('negative');
  }
}

// Clock
function startClock() {
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
}

function updateClock() {
  const now = new Date();

  if (elements.currentTime) {
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    elements.currentTime.textContent = `${hours}:${minutes}:${seconds}`;
  }

  if (elements.currentDate) {
    const options = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
    elements.currentDate.textContent = now.toLocaleDateString('de-DE', options);
  }
}

// Timer Functions
function restoreTimerState() {
  if (timerState.isRunning && timerState.startTimestamp) {
    updateTimerUI(true, timerState.isPaused);
    startTimerInterval();

    const startDate = new Date(timerState.startTimestamp);
    const startTimeStr = formatTime(startDate.getHours(), startDate.getMinutes());

    if (elements.manualStartTime) {
      elements.manualStartTime.value = startTimeStr;
    }
    if (elements.startTime) {
      elements.startTime.value = startTimeStr;
    }

    updateEndTimeDisplay();
  } else {
    updateTimerUI(false, false);
    if (elements.timerValue) {
      elements.timerValue.textContent = '00:00';
    }
    if (elements.remainingTime) {
      elements.remainingTime.classList.remove('overtime');
      elements.remainingTime.textContent = `Noch ${OvertimeUtils.formatMinutesHHMM(settings.targetMinutes || 0)} zu arbeiten`;
    }
  }
}

function toggleTimer() {
  if (timerState.isRunning) {
    stopTimer();
  } else {
    startTimer();
  }
}

function onManualStartTimeChange() {
  if (!timerState.isRunning) {
    if (elements.startTime && elements.manualStartTime) {
      elements.startTime.value = elements.manualStartTime.value || '';
    }
    updateEndTimeDisplay();
    updateEntrySummary();
    updateStoppedTimerDisplayFromEntry();
  }
}

async function startTimer() {
  const now = new Date();
  let startTimeStr;

  if (elements.manualStartTime && elements.manualStartTime.value) {
    startTimeStr = elements.manualStartTime.value;
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    const manualDate = new Date();
    manualDate.setHours(hours || 0, minutes || 0, 0, 0);
    timerState.startTimestamp = manualDate.getTime();
  } else {
    startTimeStr = formatTime(now.getHours(), now.getMinutes());
    timerState.startTimestamp = Date.now();
  }

  timerState.isRunning = true;
  timerState.isPaused = false;
  timerState.totalPausedMs = 0;
  timerState.pauseStartTimestamp = null;

  updateTimerUI(true, false);
  startTimerInterval();

  if (elements.startTime) {
    elements.startTime.value = startTimeStr;
  }
  if (elements.manualStartTime) {
    elements.manualStartTime.value = startTimeStr;
  }
  if (elements.entryDate) {
    elements.entryDate.value = OvertimeUtils.formatDateKey(now);
  }

  updateEndTimeDisplay();
  await saveData();
}

async function stopTimer() {
  // Add any ongoing pause time
  if (timerState.isPaused && timerState.pauseStartTimestamp) {
    const pauseDuration = Date.now() - timerState.pauseStartTimestamp;
    timerState.totalPausedMs = (timerState.totalPausedMs || 0) + pauseDuration;
  }

  timerState.isRunning = false;
  timerState.isPaused = false;
  timerState.pauseStartTimestamp = null;

  const now = new Date();
  const endTimeStr = formatTime(now.getHours(), now.getMinutes());

  if (elements.endTime) {
    elements.endTime.value = endTimeStr;
  }

  updateTimerUI(false, false);
  stopTimerInterval();
  updateStoppedTimerDisplayFromEntry();
  updateEntrySummary();

  if (elements.addEntry) {
    elements.addEntry.disabled = false;
  }

  await saveData();
}

function updateStoppedTimerDisplayFromEntry() {
  const startTime = elements.startTime ? elements.startTime.value : '';
  const endTime = elements.endTime ? elements.endTime.value : '';
  const targetMinutes = Math.max(0, settings.targetMinutes || 0);

  if (!startTime || !endTime) {
    return;
  }

  const extraPauseMinutes = Math.floor((timerState.totalPausedMs || 0) / 60000);
  const grossWorked = calculateGrossMinutes(startTime, endTime);
  const breakMinutes = calculateBreakMinutes(grossWorked, extraPauseMinutes);
  const worked = calculateWorkedMinutes(startTime, endTime, breakMinutes);
  const diffMinutes = calculateDifference(worked);
  const progressPercent = targetMinutes === 0 ? 100 : Math.min(100, (worked / targetMinutes) * 100);

  if (elements.timerValue) {
    elements.timerValue.textContent = OvertimeUtils.formatMinutesHHMM(worked);
  }
  if (elements.progressFill) {
    elements.progressFill.style.width = `${progressPercent}%`;
  }
  if (elements.progressPercent) {
    elements.progressPercent.textContent = `${Math.round(progressPercent)}%`;
  }
  if (elements.remainingTime) {
    elements.remainingTime.classList.remove('overtime');
    if (diffMinutes < 0) {
      elements.remainingTime.textContent = `Noch ${OvertimeUtils.formatMinutesHHMM(Math.abs(diffMinutes))} zu arbeiten`;
    } else if (diffMinutes === 0) {
      elements.remainingTime.textContent = 'Sollzeit erreicht';
    } else {
      elements.remainingTime.textContent = `${OvertimeUtils.formatMinutesHHMM(diffMinutes)} Überstunden`;
      elements.remainingTime.classList.add('overtime');
    }
  }
}

async function togglePause() {
  if (timerState.isPaused) {
    // Resume from pause
    if (timerState.pauseStartTimestamp) {
      const pauseDuration = Date.now() - timerState.pauseStartTimestamp;
      timerState.totalPausedMs = (timerState.totalPausedMs || 0) + pauseDuration;
    }
    timerState.pauseStartTimestamp = null;
    timerState.isPaused = false;
  } else {
    // Start pause
    timerState.pauseStartTimestamp = Date.now();
    timerState.isPaused = true;
  }

  updateTimerUI(true, timerState.isPaused);
  updatePauseDisplay();
  await saveData();
}

function resetTimerState() {
  timerState = {
    isRunning: false,
    isPaused: false,
    startTimestamp: null,
    pauseStartTimestamp: null,
    totalPausedMs: 0
  };

  if (elements.manualStartTime) {
    elements.manualStartTime.value = '';
  }
  if (elements.timerValue) {
    elements.timerValue.textContent = '00:00';
  }
  if (elements.addEntry) {
    elements.addEntry.disabled = true;
  }
  if (elements.progressFill) {
    elements.progressFill.style.width = '0%';
  }
  if (elements.progressPercent) {
    elements.progressPercent.textContent = '0%';
  }
  if (elements.remainingTime) {
    elements.remainingTime.classList.remove('overtime');
    elements.remainingTime.textContent = `Noch ${OvertimeUtils.formatMinutesHHMM(settings.targetMinutes || 0)} zu arbeiten`;
  }

  updateTimerUI(false, false);
  updateEndTimeDisplay();
  updateEntrySummary();
  saveData();
}

function updateTimerUI(isRunning, isPaused) {
  const toggleBtn = elements.timerToggle;
  const pauseBtn = elements.pauseToggle;

  if (!toggleBtn) return;

  if (isRunning) {
    toggleBtn.innerHTML = '<span class="btn-icon">■</span><span class="btn-text">Stop</span>';
    toggleBtn.classList.add('running');

    if (pauseBtn) {
      pauseBtn.classList.remove('hidden');
    }
    if (elements.startTimeInput) {
      elements.startTimeInput.classList.add('hidden');
    }

    if (isPaused) {
      if (pauseBtn) {
        pauseBtn.innerHTML = '<span class="btn-icon">▶</span><span class="btn-text">Weiter</span>';
        pauseBtn.classList.add('active');
      }
      if (elements.timerDisplay) {
        elements.timerDisplay.classList.add('paused');
        elements.timerDisplay.classList.remove('running');
      }
      if (elements.pauseInfo) {
        elements.pauseInfo.classList.remove('hidden');
      }
    } else {
      if (pauseBtn) {
        pauseBtn.innerHTML = '<span class="btn-icon">⏸</span><span class="btn-text">Pause</span>';
        pauseBtn.classList.remove('active');
      }
      if (elements.timerDisplay) {
        elements.timerDisplay.classList.add('running');
        elements.timerDisplay.classList.remove('paused');
      }
      if (elements.pauseInfo) {
        elements.pauseInfo.classList.add('hidden');
      }
    }
  } else {
    toggleBtn.innerHTML = '<span class="btn-icon">▶</span><span class="btn-text">Start</span>';
    toggleBtn.classList.remove('running');

    if (pauseBtn) {
      pauseBtn.classList.add('hidden');
    }
    if (elements.startTimeInput) {
      elements.startTimeInput.classList.remove('hidden');
    }
    if (elements.timerDisplay) {
      elements.timerDisplay.classList.remove('running', 'paused');
    }
    if (elements.pauseInfo) {
      elements.pauseInfo.classList.add('hidden');
    }
  }

  updateStatusDisplay();
}

function updateStatusDisplay() {
  const status = elements.timerStatus;
  if (!status) return;

  const statusText = status.querySelector('.status-text');
  if (!statusText) return;

  status.classList.remove('ready', 'running', 'paused');

  if (timerState.isRunning) {
    if (timerState.isPaused) {
      status.classList.add('paused');
      statusText.textContent = 'Pausiert';
    } else {
      status.classList.add('running');
      statusText.textContent = 'Läuft';
    }
  } else {
    status.classList.add('ready');
    statusText.textContent = 'Bereit';
  }
}

function startTimerInterval() {
  stopTimerInterval(); // Clear any existing interval
  updateTimerDisplay();
  timerInterval = setInterval(updateTimerDisplay, 1000);
}

function stopTimerInterval() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  if (!timerState.startTimestamp) {
    if (elements.timerValue) {
      elements.timerValue.textContent = '00:00';
    }
    return;
  }

  const computation = getLiveWorkComputation(Date.now());
  if (!computation) {
    return;
  }

  if (elements.timerValue) {
    elements.timerValue.textContent = OvertimeUtils.formatMinutesHHMM(computation.effectiveWorkedMinutes);
  }

  const progressPercent = computation.dailyTargetMinutes === 0
    ? 100
    : Math.min(100, (computation.effectiveWorkedMinutes / computation.dailyTargetMinutes) * 100);

  if (elements.progressFill) {
    elements.progressFill.style.width = `${progressPercent}%`;
  }
  if (elements.progressPercent) {
    elements.progressPercent.textContent = `${Math.round(progressPercent)}%`;
  }

  if (elements.remainingTime) {
    elements.remainingTime.classList.remove('overtime');

    if (computation.balanceMinutes < 0) {
      elements.remainingTime.textContent = `Noch ${OvertimeUtils.formatMinutesHHMM(Math.abs(computation.balanceMinutes))} zu arbeiten`;
    } else if (computation.balanceMinutes === 0) {
      elements.remainingTime.textContent = 'Sollzeit erreicht';
    } else {
      elements.remainingTime.textContent = `${OvertimeUtils.formatMinutesHHMM(computation.balanceMinutes)} Überstunden`;
      elements.remainingTime.classList.add('overtime');
    }
  }

  updatePauseDisplay();
}

function updatePauseDisplay() {
  const totalPauseMs = getTotalPauseMs(true);

  const pauseMinutes = Math.floor(totalPauseMs / 60000);
  const pauseSeconds = Math.floor((totalPauseMs % 60000) / 1000);

  if (elements.pauseDuration) {
    elements.pauseDuration.textContent = `${pauseMinutes}:${pauseSeconds.toString().padStart(2, '0')}`;
  }
}

function updateEndTimeDisplay() {
  let startTimeStr = elements.manualStartTime ? elements.manualStartTime.value : '';

  if (!startTimeStr && timerState.startTimestamp) {
    const startDate = new Date(timerState.startTimestamp);
    startTimeStr = formatTime(startDate.getHours(), startDate.getMinutes());
  }

  if (!startTimeStr) {
    const now = new Date();
    startTimeStr = formatTime(now.getHours(), now.getMinutes());
  }

  const [hours, minutes] = (startTimeStr || '08:00').split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours || 0, minutes || 0, 0, 0);
  const startTimestamp = startDate.getTime();
  const manualBreakMinutes = timerState.startTimestamp ? Math.floor(getTotalPauseMs(true) / 60000) : 0;
  const computation = OvertimeUtils.calculateLiveWorkBalance({
    workStart: startTimestamp,
    now: Date.now(),
    dailyTargetMinutes: settings.targetMinutes || 0,
    manualBreakMinutes
  });
  const expectedEndDate = new Date(computation.expectedEnd);

  if (elements.endTimeValue) {
    elements.endTimeValue.textContent = formatTime(expectedEndDate.getHours(), expectedEndDate.getMinutes());
  }

  if (elements.endTimeNote) {
    let note = computation.mandatoryBreakMinutes > 0
      ? `(inkl. ${OvertimeUtils.formatMinutesHHMM(computation.mandatoryBreakMinutes)} Pflichtpause)`
      : '(ohne Pflichtpause)';
    if (computation.manualBreakMinutes > 0) {
      note += ` + ${OvertimeUtils.formatMinutesHHMM(computation.manualBreakMinutes)} manuell`;
    }
    elements.endTimeNote.textContent = note;
  }
}

function updateEntrySummary() {
  const startTime = elements.startTime ? elements.startTime.value : '';
  const endTime = elements.endTime ? elements.endTime.value : '';
  const date = elements.entryDate ? elements.entryDate.value : '';

  if (!startTime || !endTime || !date) {
    if (elements.summaryDate) elements.summaryDate.textContent = '--';
    if (elements.summaryTimes) elements.summaryTimes.textContent = '--:-- - --:--';
    if (elements.summaryWorked) elements.summaryWorked.textContent = '--:--';
    if (elements.summaryDiff) {
      elements.summaryDiff.textContent = '--:--';
      elements.summaryDiff.classList.remove('positive', 'negative');
    }
    return;
  }

  const extraPauseMinutes = Math.floor((timerState.totalPausedMs || 0) / 60000);
  const grossWorked = calculateGrossMinutes(startTime, endTime);
  const breakMinutes = calculateBreakMinutes(grossWorked, extraPauseMinutes);
  const worked = calculateWorkedMinutes(startTime, endTime, breakMinutes);
  const diff = calculateDifference(worked);

  if (elements.summaryDate) elements.summaryDate.textContent = formatDate(date);
  if (elements.summaryTimes) elements.summaryTimes.textContent = `${startTime} - ${endTime}${isOvernightShift(startTime, endTime) ? ' (+1 Tag)' : ''}`;
  if (elements.summaryWorked) elements.summaryWorked.textContent = formatMinutesSimple(worked);

  if (elements.summaryDiff) {
    elements.summaryDiff.textContent = formatMinutes(diff);
    elements.summaryDiff.classList.remove('positive', 'negative');
    if (diff > 0) {
      elements.summaryDiff.classList.add('positive');
    } else if (diff < 0) {
      elements.summaryDiff.classList.add('negative');
    }
  }
}

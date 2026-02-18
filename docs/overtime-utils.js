(function initOvertimeUtils(globalScope) {
  const MANDATORY_BREAK_THRESHOLD_MINUTES = 360;
  const MANDATORY_BREAK_MINUTES = 30;

  function parseTimeToMinutes(timeString) {
    if (!timeString || typeof timeString !== 'string') return 0;
    const parts = timeString.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  }

  function calculateGrossMinutes(startTime, endTime) {
    const start = parseTimeToMinutes(startTime);
    const end = parseTimeToMinutes(endTime);
    let gross = end - start;

    // Handle shifts that end after midnight.
    if (gross < 0) {
      gross += 24 * 60;
    }

    return gross;
  }

  function calculateBreakMinutes(
    grossWorkedMinutes,
    scheduledBreakMinutes,
    extraPauseMinutes = 0,
    breakThresholdMinutes = 360
  ) {
    const gross = Number(grossWorkedMinutes) || 0;
    const scheduled = gross > breakThresholdMinutes ? (Number(scheduledBreakMinutes) || 0) : 0;
    const extra = Number(extraPauseMinutes) || 0;
    return Math.max(0, scheduled + extra);
  }

  function calculateWorkedMinutes(startTime, endTime, breakMinutes) {
    const grossWorkedMinutes = calculateGrossMinutes(startTime, endTime);
    const breakMins = Number(breakMinutes) || 0;
    return Math.max(0, grossWorkedMinutes - breakMins);
  }

  function isOvernightShift(startTime, endTime) {
    return parseTimeToMinutes(endTime) < parseTimeToMinutes(startTime);
  }

  function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function parseDateKey(dateKey) {
    if (typeof dateKey !== 'string') return null;
    const [year, month, day] = dateKey.split('-').map((part) => parseInt(part, 10));
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  function addDaysToDateKey(dateKey, days) {
    const date = parseDateKey(dateKey);
    if (!date) return dateKey;
    date.setDate(date.getDate() + (Number(days) || 0));
    return formatDateKey(date);
  }

  function formatDateForDisplay(dateKey, locale = 'de-DE') {
    const date = parseDateKey(dateKey);
    if (!date || Number.isNaN(date.getTime())) return dateKey;
    const options = { weekday: 'short', day: '2-digit', month: '2-digit' };
    return date.toLocaleDateString(locale, options);
  }

  function minutesBetween(startTimestamp, endTimestamp) {
    const start = Number(startTimestamp) || 0;
    const end = Number(endTimestamp) || 0;
    const diffMs = Math.max(0, end - start);
    return Math.floor(diffMs / 60000);
  }

  function formatMinutesHHMM(totalMinutes) {
    const minutes = Math.max(0, Math.floor(Number(totalMinutes) || 0));
    const hoursPart = Math.floor(minutes / 60);
    const minutesPart = minutes % 60;
    return `${String(hoursPart).padStart(2, '0')}:${String(minutesPart).padStart(2, '0')}`;
  }

  function calculateLiveWorkBalance({
    workStart,
    now,
    dailyTargetMinutes,
    manualBreakMinutes = 0
  }) {
    const grossWorkedMinutes = minutesBetween(workStart, now);
    const mandatoryBreakMinutes =
      grossWorkedMinutes > MANDATORY_BREAK_THRESHOLD_MINUTES ? MANDATORY_BREAK_MINUTES : 0;
    const normalizedManualBreakMinutes = Math.max(0, Math.floor(Number(manualBreakMinutes) || 0));
    const normalizedTargetMinutes = Math.max(0, Math.floor(Number(dailyTargetMinutes) || 0));

    const effectiveWorkedMinutes = Math.max(
      0,
      grossWorkedMinutes - mandatoryBreakMinutes - normalizedManualBreakMinutes
    );
    const balanceMinutes = effectiveWorkedMinutes - normalizedTargetMinutes;
    const expectedEnd =
      (Number(workStart) || 0) +
      (normalizedTargetMinutes + mandatoryBreakMinutes + normalizedManualBreakMinutes) * 60000;

    return {
      grossWorkedMinutes,
      mandatoryBreakMinutes,
      manualBreakMinutes: normalizedManualBreakMinutes,
      effectiveWorkedMinutes,
      dailyTargetMinutes: normalizedTargetMinutes,
      balanceMinutes,
      expectedEnd
    };
  }

  globalScope.OvertimeUtils = {
    MANDATORY_BREAK_THRESHOLD_MINUTES,
    MANDATORY_BREAK_MINUTES,
    parseTimeToMinutes,
    calculateGrossMinutes,
    calculateBreakMinutes,
    calculateWorkedMinutes,
    isOvernightShift,
    formatDateKey,
    parseDateKey,
    addDaysToDateKey,
    formatDateForDisplay,
    minutesBetween,
    formatMinutesHHMM,
    calculateLiveWorkBalance
  };
})(globalThis);

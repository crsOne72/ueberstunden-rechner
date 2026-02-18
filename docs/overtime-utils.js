(function initOvertimeUtils(globalScope) {
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

  globalScope.OvertimeUtils = {
    parseTimeToMinutes,
    calculateGrossMinutes,
    calculateBreakMinutes,
    calculateWorkedMinutes,
    isOvernightShift,
    formatDateKey,
    parseDateKey,
    addDaysToDateKey,
    formatDateForDisplay
  };
})(globalThis);

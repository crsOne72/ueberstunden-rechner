const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadUtils() {
  const utilsPath = path.join(__dirname, 'overtime-utils.js');
  const code = fs.readFileSync(utilsPath, 'utf8');
  const context = { globalThis: {} };
  vm.createContext(context);
  vm.runInContext(code, context);
  return context.globalThis.OvertimeUtils;
}

function minutes(min) {
  return min * 60 * 1000;
}

function runTests() {
  const utils = loadUtils();
  const base = Date.UTC(2026, 1, 18, 8, 0, 0, 0);
  const target = 468;

  // Edge: exactly 6h -> no mandatory break
  {
    const result = utils.calculateWorkBalance({
      workStart: base,
      now: base + minutes(360),
      dailyTargetMinutes: target
    });
    assert.equal(result.grossWorkedMinutes, 360);
    assert.equal(result.mandatoryBreakMinutes, 0);
    assert.equal(result.effectiveWorkedMinutes, 360);
    assert.equal(result.balanceMinutes, -108);
  }

  // Edge: 6h + 1m -> mandatory break applies
  {
    const result = utils.calculateWorkBalance({
      workStart: base,
      now: base + minutes(361),
      dailyTargetMinutes: target
    });
    assert.equal(result.grossWorkedMinutes, 361);
    assert.equal(result.mandatoryBreakMinutes, 30);
    assert.equal(result.effectiveWorkedMinutes, 331);
    assert.equal(result.balanceMinutes, -137);
  }

  // Manual break is additionally subtracted
  {
    const result = utils.calculateWorkBalance({
      workStart: base,
      now: base + minutes(500),
      dailyTargetMinutes: target,
      manualBreakMinutes: 25
    });
    assert.equal(result.mandatoryBreakMinutes, 30);
    assert.equal(result.effectiveWorkedMinutes, 445);
    assert.equal(result.balanceMinutes, -23);
  }

  // Clamp effective to 0
  {
    const result = utils.calculateWorkBalance({
      workStart: base,
      now: base + minutes(20),
      dailyTargetMinutes: target,
      manualBreakMinutes: 90
    });
    assert.equal(result.effectiveWorkedMinutes, 0);
    assert.equal(result.balanceMinutes, -468);
  }

  // Real case A:
  // Start 15:00, now 23:11 -> gross 491 -> mandatory 30 -> effective 461 -> balance -7 (target 468)
  {
    const start = Date.UTC(2026, 1, 18, 15, 0, 0, 0);
    const now = Date.UTC(2026, 1, 18, 23, 11, 0, 0);
    const result = utils.calculateWorkBalance({
      workStart: start,
      now,
      dailyTargetMinutes: target
    });
    assert.equal(result.grossWorkedMinutes, 491);
    assert.equal(result.mandatoryBreakMinutes, 30);
    assert.equal(result.effectiveWorkedMinutes, 461);
    assert.equal(result.balanceMinutes, -7);
    assert.equal(result.expectedEndTime, start + minutes(498)); // 468 + 30
  }

  // Real case B:
  // Start 08:00, now 16:30 -> gross 510 -> mandatory 30 -> effective 480 -> balance +12
  {
    const start = Date.UTC(2026, 1, 18, 8, 0, 0, 0);
    const now = Date.UTC(2026, 1, 18, 16, 30, 0, 0);
    const result = utils.calculateWorkBalance({
      workStart: start,
      now,
      dailyTargetMinutes: target
    });
    assert.equal(result.grossWorkedMinutes, 510);
    assert.equal(result.mandatoryBreakMinutes, 30);
    assert.equal(result.effectiveWorkedMinutes, 480);
    assert.equal(result.balanceMinutes, 12);
    assert.equal(result.expectedEndTime, start + minutes(498));
  }

  // expectedEndTime consistency with manual break
  {
    const result = utils.calculateWorkBalance({
      workStart: base,
      now: base + minutes(500),
      dailyTargetMinutes: target,
      manualBreakMinutes: 20
    });
    assert.equal(result.expectedEndTime, base + minutes(518)); // 468 + 30 + 20
  }
}

runTests();
console.log('overtime-utils tests passed');

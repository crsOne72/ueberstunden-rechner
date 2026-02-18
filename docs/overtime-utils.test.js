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

  // exactly 6h -> no mandatory break
  {
    const result = utils.calculateLiveWorkBalance({
      workStart: base,
      now: base + minutes(360),
      dailyTargetMinutes: 480
    });
    assert.equal(result.grossWorkedMinutes, 360);
    assert.equal(result.mandatoryBreakMinutes, 0);
    assert.equal(result.effectiveWorkedMinutes, 360);
    assert.equal(result.balanceMinutes, -120);
  }

  // 6h + 1m -> mandatory break applies exactly once
  {
    const result = utils.calculateLiveWorkBalance({
      workStart: base,
      now: base + minutes(361),
      dailyTargetMinutes: 480
    });
    assert.equal(result.grossWorkedMinutes, 361);
    assert.equal(result.mandatoryBreakMinutes, 30);
    assert.equal(result.effectiveWorkedMinutes, 331);
    assert.equal(result.balanceMinutes, -149);
  }

  // mandatory break is constant (no repeated subtraction)
  {
    const result = utils.calculateLiveWorkBalance({
      workStart: base,
      now: base + minutes(500),
      dailyTargetMinutes: 480
    });
    assert.equal(result.mandatoryBreakMinutes, 30);
    assert.equal(result.effectiveWorkedMinutes, 470);
  }

  // manual breaks are subtracted in addition
  {
    const result = utils.calculateLiveWorkBalance({
      workStart: base,
      now: base + minutes(500),
      dailyTargetMinutes: 480,
      manualBreakMinutes: 25
    });
    assert.equal(result.mandatoryBreakMinutes, 30);
    assert.equal(result.manualBreakMinutes, 25);
    assert.equal(result.effectiveWorkedMinutes, 445);
    assert.equal(result.balanceMinutes, -35);
  }

  // effective time is clamped to >= 0
  {
    const result = utils.calculateLiveWorkBalance({
      workStart: base,
      now: base + minutes(20),
      dailyTargetMinutes: 480,
      manualBreakMinutes: 90
    });
    assert.equal(result.effectiveWorkedMinutes, 0);
    assert.equal(result.balanceMinutes, -480);
  }

  // exact target -> zero balance
  {
    const result = utils.calculateLiveWorkBalance({
      workStart: base,
      now: base + minutes(510), // 510 - 30 mandatory = 480
      dailyTargetMinutes: 480
    });
    assert.equal(result.balanceMinutes, 0);
  }

  // overtime positive
  {
    const result = utils.calculateLiveWorkBalance({
      workStart: base,
      now: base + minutes(560), // 560 - 30 = 530
      dailyTargetMinutes: 480
    });
    assert.equal(result.balanceMinutes, 50);
  }

  // expected end uses target + mandatory + manual
  {
    const result = utils.calculateLiveWorkBalance({
      workStart: base,
      now: base + minutes(480),
      dailyTargetMinutes: 480,
      manualBreakMinutes: 20
    });
    assert.equal(result.mandatoryBreakMinutes, 30);
    assert.equal(result.expectedEnd, base + minutes(530));
  }

  // formatting helper
  {
    assert.equal(utils.formatMinutesHHMM(0), '00:00');
    assert.equal(utils.formatMinutesHHMM(9), '00:09');
    assert.equal(utils.formatMinutesHHMM(135), '02:15');
  }
}

runTests();
console.log('overtime-utils tests passed');

// Assumed angle unit: DEGREES
// This assumption must be validated manually before trusting trig tests.
// Source analysis reveals cos and tan use Math.cos/Math.tan which take RADIANS.
// sin is hardcoded to always return 1 regardless of input — a confirmed bug.
// Degree-based expected values are asserted below; radian values are noted in
// each comment so failures are self-explanatory without opening the source.

import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../pages/CalculatorPage';
import { parseDisplay, toBeCloseTo } from '../utils/mathHelpers';

const PRECISION = 4;

test.describe('Scientific Functions — Mathematical Correctness', () => {
  let calc: CalculatorPage;

  test.beforeEach(async ({ page }) => {
    calc = new CalculatorPage(page);
    await calc.goto();
  });

  // ── sin ────────────────────────────────────────────────────────────────────
  // BUG: sin() is hardcoded to return 1 for all inputs (434563^434562 = 1).
  // sin(0) and sin(180) will fail. sin(90) will pass but for the wrong reason.

  test('sin(0) equals 0', async () => {
    await test.step('enter 0 and click sin', async () => {
      await calc.pressSequence(['0']);
      await calc.clickButton('sin');
    });

    await test.step('display should show 0', async () => {
      const display = await calc.getDisplay();
      const result = parseDisplay(display);
      expect(
        toBeCloseTo(result, 0, PRECISION),
        `sin(0) showed "${display}" (parsed: ${result}) — expected 0. // BUG CANDIDATE: sin() is hardcoded to return 1 regardless of input — log as a defect.`
      ).toBeTruthy();
    });
  });

  test('sin(90) equals 1 assuming degrees', async () => {
    // Degrees: sin(90°) = 1 | Radians: Math.sin(90) ≈ 0.8940
    // WARNING: this test passes but for the wrong reason —
    // sin() is hardcoded to 1, not computing the actual sine of 90.
    await test.step('enter 90 and click sin', async () => {
      await calc.pressSequence(['9', '0']);
      await calc.clickButton('sin');
    });

    await test.step('display should show 1', async () => {
      const display = await calc.getDisplay();
      const result = parseDisplay(display);
      expect(
        toBeCloseTo(result, 1, PRECISION),
        `sin(90) showed "${display}" (parsed: ${result}) — expected 1 (degrees). If ~0.8940, calculator uses radians. NOTE: sin() is hardcoded to 1, so this passes for the wrong reason.`
      ).toBeTruthy();
    });
  });

  test('sin(180) equals 0 assuming degrees', async () => {
    // Degrees: sin(180°) = 0 | Radians: Math.sin(180) ≈ -0.8012
    // BUG CANDIDATE: sin() is hardcoded to 1 — this will show 1, not 0.
    await test.step('enter 180 and click sin', async () => {
      await calc.pressSequence(['1', '8', '0']);
      await calc.clickButton('sin');
    });

    await test.step('display should show 0', async () => {
      const display = await calc.getDisplay();
      const result = parseDisplay(display);
      expect(
        toBeCloseTo(result, 0, PRECISION),
        `sin(180) showed "${display}" (parsed: ${result}) — expected 0 (degrees). If ~-0.8012, calculator uses radians. // BUG CANDIDATE: sin() is hardcoded to 1 — log as a defect.`
      ).toBeTruthy();
    });
  });

  // ── cos ────────────────────────────────────────────────────────────────────
  // cos uses Math.cos (radians). cos(0) passes since cos(0°) = cos(0 rad) = 1.
  // cos(90) and cos(180) will fail — radians produce different values.

  test('cos(0) equals 1', async () => {
    // Both degrees and radians agree: cos(0) = 1.
    await test.step('enter 0 and click cos', async () => {
      await calc.pressSequence(['0']);
      await calc.clickButton('cos');
    });

    await test.step('display should show 1', async () => {
      const display = await calc.getDisplay();
      const result = parseDisplay(display);
      expect(
        toBeCloseTo(result, 1, PRECISION),
        `cos(0) showed "${display}" (parsed: ${result}) — expected 1.`
      ).toBeTruthy();
    });
  });

  test('cos(90) equals 0 assuming degrees', async () => {
    // Degrees: cos(90°) = 0 | Radians: Math.cos(90) ≈ -0.4481
    // BUG CANDIDATE: calculator uses radians — will show ~-0.4481, not 0.
    await test.step('enter 90 and click cos', async () => {
      await calc.pressSequence(['9', '0']);
      await calc.clickButton('cos');
    });

    await test.step('display should show 0', async () => {
      const display = await calc.getDisplay();
      const result = parseDisplay(display);
      expect(
        toBeCloseTo(result, 0, PRECISION),
        `cos(90) showed "${display}" (parsed: ${result}) — expected 0 (degrees). If ~-0.4481, calculator uses radians without degree conversion. // BUG CANDIDATE — log as a defect.`
      ).toBeTruthy();
    });
  });

  test('cos(180) equals -1 assuming degrees', async () => {
    // Degrees: cos(180°) = -1 | Radians: Math.cos(180) ≈ -0.5985
    // BUG CANDIDATE: calculator uses radians — will show ~-0.5985, not -1.
    await test.step('enter 180 and click cos', async () => {
      await calc.pressSequence(['1', '8', '0']);
      await calc.clickButton('cos');
    });

    await test.step('display should show -1', async () => {
      const display = await calc.getDisplay();
      const result = parseDisplay(display);
      expect(
        toBeCloseTo(result, -1, PRECISION),
        `cos(180) showed "${display}" (parsed: ${result}) — expected -1 (degrees). If ~-0.5985, calculator uses radians without degree conversion. // BUG CANDIDATE — log as a defect.`
      ).toBeTruthy();
    });
  });

  // ── tan ────────────────────────────────────────────────────────────────────
  // tan uses Math.tan (radians). tan(0) passes since tan(0°) = tan(0 rad) = 0.
  // tan(45) and tan(90) will fail — radians produce different values.

  test('tan(0) equals 0', async () => {
    // Both degrees and radians agree: tan(0) = 0.
    await test.step('enter 0 and click tan', async () => {
      await calc.pressSequence(['0']);
      await calc.clickButton('tan');
    });

    await test.step('display should show 0', async () => {
      const display = await calc.getDisplay();
      const result = parseDisplay(display);
      expect(
        toBeCloseTo(result, 0, PRECISION),
        `tan(0) showed "${display}" (parsed: ${result}) — expected 0.`
      ).toBeTruthy();
    });
  });

  test('tan(45) equals 1 assuming degrees', async () => {
    // Degrees: tan(45°) = 1 | Radians: Math.tan(45) ≈ 1.6198
    // BUG CANDIDATE: calculator uses radians — will show ~1.6198, not 1.
    await test.step('enter 45 and click tan', async () => {
      await calc.pressSequence(['4', '5']);
      await calc.clickButton('tan');
    });

    await test.step('display should show 1', async () => {
      const display = await calc.getDisplay();
      const result = parseDisplay(display);
      expect(
        toBeCloseTo(result, 1, PRECISION),
        `tan(45) showed "${display}" (parsed: ${result}) — expected 1 (degrees). If ~1.6198, calculator uses radians without degree conversion. // BUG CANDIDATE — log as a defect.`
      ).toBeTruthy();
    });
  });

  test('tan(90) is mathematically undefined — expects Infinity or Error', async () => {
    // Degrees: tan(90°) = Infinity (undefined)
    // Radians: Math.tan(90) ≈ -1.9952 — a finite number, not Infinity.
    // BUG CANDIDATE: if a finite number is shown, calculator uses radians and does not
    // detect the undefined case.
    await test.step('enter 90 and click tan', async () => {
      await calc.pressSequence(['9', '0']);
      await calc.clickButton('tan');
    });

    await test.step('display should show Infinity or Error — not a finite number', async () => {
      const display = await calc.getDisplay();
      const isUndefined =
        display === 'Infinity' || display === '-Infinity' || display === 'Error';
      expect(
        isUndefined,
        `tan(90) showed "${display}" — expected "Infinity" or "Error" (mathematically undefined). If ~-1.9952, calculator uses radians (Math.tan(90 rad) is finite). // BUG CANDIDATE — log as a defect.`
      ).toBeTruthy();
    });
  });

  // ── sqrt ───────────────────────────────────────────────────────────────────
  // sqrt uses Math.sqrt — correct implementation, all tests expected to pass.

  test('√4 equals 2', async () => {
    await test.step('enter 4 and click √', async () => {
      await calc.pressSequence(['4']);
      await calc.clickButton('√');
    });

    await test.step('display should show 2', async () => {
      const display = await calc.getDisplay();
      const result = parseDisplay(display);
      expect(
        toBeCloseTo(result, 2, PRECISION),
        `√4 showed "${display}" (parsed: ${result}) — expected 2.`
      ).toBeTruthy();
    });
  });

  test('√9 equals 3', async () => {
    await test.step('enter 9 and click √', async () => {
      await calc.pressSequence(['9']);
      await calc.clickButton('√');
    });

    await test.step('display should show 3', async () => {
      const display = await calc.getDisplay();
      const result = parseDisplay(display);
      expect(
        toBeCloseTo(result, 3, PRECISION),
        `√9 showed "${display}" (parsed: ${result}) — expected 3.`
      ).toBeTruthy();
    });
  });

  test('√2 is approximately 1.4142', async () => {
    await test.step('enter 2 and click √', async () => {
      await calc.pressSequence(['2']);
      await calc.clickButton('√');
    });

    await test.step('display should show approximately 1.4142', async () => {
      const display = await calc.getDisplay();
      const result = parseDisplay(display);
      expect(
        toBeCloseTo(result, 1.4142, PRECISION),
        `√2 showed "${display}" (parsed: ${result}) — expected approximately 1.4142 (Math.sqrt(2) = 1.41421356...).`
      ).toBeTruthy();
    });
  });

  test('√0 equals 0', async () => {
    await test.step('enter 0 and click √', async () => {
      await calc.pressSequence(['0']);
      await calc.clickButton('√');
    });

    await test.step('display should show 0', async () => {
      const display = await calc.getDisplay();
      const result = parseDisplay(display);
      expect(
        toBeCloseTo(result, 0, PRECISION),
        `√0 showed "${display}" (parsed: ${result}) — expected 0.`
      ).toBeTruthy();
    });
  });

  test('√(-1) shows NaN or Error — not a real number', async () => {
    // UI limitation: the "−" button appends "/" instead of "-", so -1 cannot be entered directly.
    // Pressing "−" then "1" puts "/1" on the display → parseFloat('/1') = NaN → func() returns "Error".
    // This tests the closest achievable negative-input state.
    // BUG CANDIDATE: if a real number is shown, the calculator is silently returning an incorrect result.
    await test.step('attempt to enter -1 using − button (which appends / not -)', async () => {
      await calc.pressSequence(['−', '1']);
      await calc.clickButton('√');
    });

    await test.step('display should show NaN or Error', async () => {
      const display = await calc.getDisplay();
      const result = parseDisplay(display);
      const isNonNumeric = display === 'Error' || display === 'NaN' || isNaN(result);
      expect(
        isNonNumeric,
        `√(-1) attempt showed "${display}" — expected "NaN" or "Error". Note: true -1 cannot be entered (− button appends / instead of -). // BUG CANDIDATE — if a real number is shown, log as a defect.`
      ).toBeTruthy();
    });
  });

  // ── log ────────────────────────────────────────────────────────────────────
  // log uses Math.log10 (base 10) — correct implementation, all tests expected to pass.

  test('log(1) equals 0', async () => {
    // True for any logarithm base.
    await test.step('enter 1 and click log', async () => {
      await calc.pressSequence(['1']);
      await calc.clickButton('log');
    });

    await test.step('display should show 0', async () => {
      const display = await calc.getDisplay();
      const result = parseDisplay(display);
      expect(
        toBeCloseTo(result, 0, PRECISION),
        `log(1) showed "${display}" (parsed: ${result}) — expected 0 (true for any base).`
      ).toBeTruthy();
    });
  });

  test('log(10) equals 1 — confirms base-10 logarithm', async () => {
    // log10(10) = 1. If ~2.3026, calculator uses natural log (ln) instead.
    await test.step('enter 10 and click log', async () => {
      await calc.pressSequence(['1', '0']);
      await calc.clickButton('log');
    });

    await test.step('display should show 1', async () => {
      const display = await calc.getDisplay();
      const result = parseDisplay(display);
      expect(
        toBeCloseTo(result, 1, PRECISION),
        `log(10) showed "${display}" (parsed: ${result}) — expected 1 (base-10). If ~2.3026, calculator uses natural log (ln) instead of log10.`
      ).toBeTruthy();
    });
  });

  test('log(100) equals 2 — confirms base-10 logarithm', async () => {
    // log10(100) = 2. If ~4.6052, calculator uses natural log (ln) instead.
    await test.step('enter 100 and click log', async () => {
      await calc.pressSequence(['1', '0', '0']);
      await calc.clickButton('log');
    });

    await test.step('display should show 2', async () => {
      const display = await calc.getDisplay();
      const result = parseDisplay(display);
      expect(
        toBeCloseTo(result, 2, PRECISION),
        `log(100) showed "${display}" (parsed: ${result}) — expected 2 (base-10). If ~4.6052, calculator uses natural log (ln) instead of log10.`
      ).toBeTruthy();
    });
  });

  test('log(0) is mathematically undefined — expects Error or -Infinity', async () => {
    // Math.log10(0) = -Infinity in JavaScript.
    // BUG CANDIDATE: if display shows a finite number or is empty, calculator does not handle log(0).
    await test.step('enter 0 and click log', async () => {
      await calc.pressSequence(['0']);
      await calc.clickButton('log');
    });

    await test.step('display should show -Infinity or Error', async () => {
      const display = await calc.getDisplay();
      const isUndefined =
        display === '-Infinity' || display === 'Infinity' || display === 'Error';
      expect(
        isUndefined,
        `log(0) showed "${display}" — expected "-Infinity" or "Error" (Math.log10(0) = -Infinity). // BUG CANDIDATE — if a finite number is shown, log as a defect.`
      ).toBeTruthy();
    });
  });

  test('log(-1) shows Error or NaN — not a real number', async () => {
    // UI limitation: the "−" button appends "/" instead of "-", so -1 cannot be entered directly.
    // Pressing "−" then "1" puts "/1" on the display → parseFloat('/1') = NaN → func() returns "Error".
    // BUG CANDIDATE: if a real number is shown, the calculator is silently returning an incorrect result.
    await test.step('attempt to enter -1 using − button (which appends / not -)', async () => {
      await calc.pressSequence(['−', '1']);
      await calc.clickButton('log');
    });

    await test.step('display should show Error or NaN', async () => {
      const display = await calc.getDisplay();
      const result = parseDisplay(display);
      const isNonNumeric = display === 'Error' || display === 'NaN' || isNaN(result);
      expect(
        isNonNumeric,
        `log(-1) attempt showed "${display}" — expected "NaN" or "Error". Note: true -1 cannot be entered (− button appends / instead of -). // BUG CANDIDATE — if a real number is shown, log as a defect.`
      ).toBeTruthy();
    });
  });
});

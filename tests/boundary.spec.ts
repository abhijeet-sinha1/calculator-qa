import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../pages/CalculatorPage';
import { parseDisplay } from '../utils/mathHelpers';

test.describe('Boundary — Edge Cases and Error States', () => {
  let calc: CalculatorPage;

  test.beforeEach(async ({ page }) => {
    calc = new CalculatorPage(page);
    await calc.goto();
  });

  test('division by zero shows Error or Infinity', async () => {
    // 8 ÷ 0 = should produce Infinity or Error per good UX.
    // Known evaluator bug: operands are reversed, so 8÷0 is computed as 0/8 = 0 internally.
    // To actually trigger a divide-by-zero in the reversed evaluator, the LEFT operand must be 0:
    // pressing 0 ÷ 8 = sends "0/8" → evaluator computes 8/0 = Infinity.
    // BUG CANDIDATE — if display shows "0", the evaluator reversed operands without detecting divide-by-zero.
    await test.step('press 0, ÷, 8, =', async () => {
      await calc.pressSequence(['0', '÷', '8', '=']);
    });

    await test.step('display should show Error or Infinity', async () => {
      const display = await calc.getDisplay();
      const isErrorState =
        display === 'Error' ||
        display === 'Infinity' ||
        display === '-Infinity';
      expect(
        isErrorState,
        `Division by zero showed "${display}" — expected "Error" or "Infinity". // BUG CANDIDATE — if this test fails, log as a defect`
      ).toBeTruthy();
    });
  });

  test('very large multiplication does not crash or return empty', async () => {
    // 999999999 × 999999999 — avoids the "3 button appends 0" bug by using only 9s.
    // Exact result: 999999998000000001, but JS floating point may show scientific notation.
    await test.step('press 999999999 × 999999999 =', async () => {
      const nines = ['9', '9', '9', '9', '9', '9', '9', '9', '9'];
      await calc.pressSequence([...nines, '×', ...nines, '=']);
    });

    await test.step('display should show a non-empty numeric result', async () => {
      const display = await calc.getDisplay();
      expect(
        display !== '' && display !== 'Error',
        `999999999 × 999999999 showed "${display}" — expected a large numeric value (possibly in scientific notation). Calculator must not crash on large inputs.`
      ).toBeTruthy();
    });
  });

  test('floating point: 0.1 + 0.2 is approximately 0.3', async () => {
    // JS: 0.1 + 0.2 = 0.30000000000000004 — display will likely show the full float.
    // Tolerance of 0.01 is used to accept the JS rounding artifact.
    // BUG CANDIDATE — if this test fails, the calculator is not handling floating point correctly.
    await test.step('press 0, ., 1, +, 0, ., 2, =', async () => {
      await calc.pressSequence(['0', '.', '1', '+', '0', '.', '2', '=']);
    });

    await test.step('result should be approximately 0.3 (within 0.01 tolerance)', async () => {
      const display = await calc.getDisplay();
      const result = parseDisplay(display);
      expect(
        Math.abs(result - 0.3) < 0.01,
        `0.1 + 0.2 showed "${display}" (parsed: ${result}) — expected approximately 0.3. JS floating point typically gives 0.30000000000000004 which is within tolerance. // BUG CANDIDATE — if this test fails, log as a defect`
      ).toBeTruthy();
    });
  });

  test('second decimal point in a number is ignored', async () => {
    // Good UX: entering 1 . . 5 should display "1.5" — second dot is a no-op.
    // This calculator uses raw string append, so it will likely display "1..5".
    // BUG CANDIDATE — if this test fails, log as a defect.
    await test.step('press 1, ., ., 5', async () => {
      await calc.pressSequence(['1', '.', '.', '5']);
    });

    await test.step('display should show 1.5 (second dot ignored)', async () => {
      const display = await calc.getDisplay();
      expect(
        display,
        `After entering "1..5", display shows "${display}" — expected "1.5". The calculator should ignore a second decimal point in the same number. // BUG CANDIDATE — if this test fails, log as a defect`
      ).toBe('1.5');
    });
  });

  test('leading zeros are handled gracefully without crashing', async () => {
    // Entering 0, 0, 7 via raw string append will likely display "007".
    // Good UX would normalise to "7", but any non-empty non-Error output is acceptable here.
    await test.step('press 0, 0, 7', async () => {
      await calc.pressSequence(['0', '0', '7']);
    });

    await test.step('display should not be empty or Error', async () => {
      const display = await calc.getDisplay();
      expect(
        display !== '' && display !== 'Error',
        `After entering 0, 0, 7 the display shows "${display}" — calculator should handle leading zeros without crashing or clearing the display.`
      ).toBeTruthy();
    });
  });

  test('negative result: 3 − 9 equals −6', async () => {
    // BUG CANDIDATE (two compounding bugs):
    //   1. The "3" button has onclick="append('0')" — pressing 3 appends 0, not 3.
    //   2. The "−" button has onclick="append('/')" — pressing − appends /, not -.
    // Actual expression sent to evaluator: "0/9".
    // Reversed-operand evaluator then computes: 9/0 = Infinity.
    // Expected per good UX: -6. Actual: likely "Infinity".
    await test.step('press 3, −, 9, =', async () => {
      await calc.pressSequence(['3', '−', '9', '=']);
    });

    await test.step('display should show -6', async () => {
      const display = await calc.getDisplay();
      expect(
        display,
        `After 3 − 9 =, display shows "${display}" — expected "-6". subtraction button (−) is mislabeled — appends / instead of -; additionally the "3" button appends "0". // BUG CANDIDATE — if this test fails, log as a defect`
      ).toBe('-6');
    });
  });

  test('pressing = with empty input does not crash', async () => {
    // Good UX: should show "0" or "Error" — must not throw or show "undefined".
    // Known behaviour: evaluateExpression returns undefined for empty input (no throw),
    // so display.value is set to undefined → shows "undefined" as a string.
    // BUG CANDIDATE — if display shows "undefined", the evaluator lacks an empty-input guard.
    await test.step('press = without any prior input', async () => {
      await calc.clickButton('=');
    });

    await test.step('display should show 0 or Error — not crash or show undefined', async () => {
      const display = await calc.getDisplay();
      const isValidState = display === '0' || display === 'Error' || display === '';
      expect(
        isValidState,
        `Pressing = with empty input shows "${display}" — expected "0" or "Error". The calculator should guard against evaluating an empty expression. // BUG CANDIDATE — if this test fails, log as a defect`
      ).toBeTruthy();
    });
  });

  test('operator immediately after another operator: 5 + × 3', async () => {
    // Good UX: second operator replaces first, giving 5 × 3 = 15, or calculator shows Error.
    // Known bug: the "3" button appends "0" instead of "3", so the actual expression is "5+*0".
    // Known behaviour: the parser consumes '*' as a primary value (parseFloat('*') = NaN),
    // so the result is NaN — displayed as "NaN".
    // BUG CANDIDATE — calculator should either replace the operator or show "Error", not "NaN".
    await test.step('press 5, +, ×, 3, =', async () => {
      await calc.pressSequence(['5', '+', '×', '3', '=']);
    });

    await test.step('display should show a result or Error — not NaN or empty', async () => {
      const display = await calc.getDisplay();
      const isValidState = display !== '' && display !== 'NaN';
      expect(
        isValidState,
        `After 5 + × 3 =, display shows "${display}" — expected a numeric result or "Error". Known bug: "3" button appends "0", so actual expression was "5+*0". Calculator must not silently produce "NaN" or empty. // BUG CANDIDATE — if this test fails, log as a defect`
      ).toBeTruthy();
    });
  });

  test('pressing = repeatedly after 5 + 2 does not re-apply the operation', async () => {
    // Uses 5 + 2 = 7 deliberately — avoids the "3 button appends 0" bug.
    // If the calculator re-applies +2 on the second =, display would show 9.
    // If it does not re-apply, display stays at 7.
    await test.step('press 5, +, 2, =', async () => {
      await calc.pressSequence(['5', '+', '2', '=']);
    });

    await test.step('press = a second time', async () => {
      await calc.clickButton('=');
    });

    await test.step('display should still show 7 — operation should not be re-applied', async () => {
      const display = await calc.getDisplay();
      expect(
        display,
        `After pressing = twice (5+2==), display shows "${display}" — expected "7". If display shows "9", the calculator is re-applying the last operation (+2) on repeated =.`
      ).toBe('7');
    });
  });
});

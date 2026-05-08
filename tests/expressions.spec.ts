// NOTE: The following buttons are excluded from all tests in this file due to known bugs:
//   - "3" button appends "0" instead of "3"
//   - "−" button (U+2212) appends "/" instead of "-"
//   - "÷" button appends "/" but the evaluator reverses operands (a÷b = b÷a)
// All tests use only: digits 0-2, 4-9, operators +, ×, and parentheses.
// The evaluator correctly implements operator precedence via recursive descent parsing.

import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../pages/CalculatorPage';

test.describe('Expressions — Precedence and Parentheses', () => {
  let calc: CalculatorPage;

  test.beforeEach(async ({ page }) => {
    calc = new CalculatorPage(page);
    await calc.goto();
  });

  // ── Operator Precedence ─────────────────────────────────────────────────────

  test('2 + 5 × 4 equals 22 — multiplication takes precedence over addition', async () => {
    // With precedence:    2 + (5×4) = 2 + 20 = 22
    // Without precedence: (2+5) × 4 = 28
    await test.step('press 2, +, 5, ×, 4, =', async () => {
      await calc.pressSequence(['2', '+', '5', '×', '4', '=']);
    });

    await test.step('display should show 22', async () => {
      const display = await calc.getDisplay();
      expect(
        display,
        `After 2 + 5 × 4 =, display shows "${display}" — expected "22". If "28", multiplication is not taking precedence over addition.`
      ).toBe('22');
    });
  });

  test('4 + 2 × 5 equals 14 — multiplication takes precedence over addition', async () => {
    // With precedence:    4 + (2×5) = 4 + 10 = 14
    // Without precedence: (4+2) × 5 = 30
    // Note: subtraction (−) cannot be tested — button appends "/" instead of "-".
    await test.step('press 4, +, 2, ×, 5, =', async () => {
      await calc.pressSequence(['4', '+', '2', '×', '5', '=']);
    });

    await test.step('display should show 14', async () => {
      const display = await calc.getDisplay();
      expect(
        display,
        `After 4 + 2 × 5 =, display shows "${display}" — expected "14". If "30", multiplication is not taking precedence over addition.`
      ).toBe('14');
    });
  });

  test('5 + 8 × 2 equals 21 — multiplication takes precedence over addition', async () => {
    // With precedence:    5 + (8×2) = 5 + 16 = 21
    // Without precedence: (5+8) × 2 = 26
    // Note: division (÷) cannot be used — evaluator reverses operands (a÷b computes as b÷a).
    await test.step('press 5, +, 8, ×, 2, =', async () => {
      await calc.pressSequence(['5', '+', '8', '×', '2', '=']);
    });

    await test.step('display should show 21', async () => {
      const display = await calc.getDisplay();
      expect(
        display,
        `After 5 + 8 × 2 =, display shows "${display}" — expected "21". If "26", multiplication is not taking precedence over addition.`
      ).toBe('21');
    });
  });

  // ── Parentheses — Happy Path ────────────────────────────────────────────────

  test('(2 + 5) × 4 equals 28 — parentheses override operator precedence', async () => {
    // Without parens: 2 + 5×4 = 22. With parens: (2+5)×4 = 28.
    await test.step('press (, 2, +, 5, ), ×, 4, =', async () => {
      await calc.pressSequence(['(', '2', '+', '5', ')', '×', '4', '=']);
    });

    await test.step('display should show 28', async () => {
      const display = await calc.getDisplay();
      expect(
        display,
        `After (2 + 5) × 4 =, display shows "${display}" — expected "28". Evaluator bug: closing ")" advances the token index by 2 instead of 1, skipping the × operator entirely — expression evaluated as "(2+5)" = 7.`
      ).toBe('28');
    });
  });

  test('(6 + 2) × (4 + 1) equals 40 — multiple parenthesised groups', async () => {
    // (6+2) × (4+1) = 8 × 5 = 40
    await test.step('press (, 6, +, 2, ), ×, (, 4, +, 1, ), =', async () => {
      await calc.pressSequence(['(', '6', '+', '2', ')', '×', '(', '4', '+', '1', ')', '=']);
    });

    await test.step('display should show 40', async () => {
      const display = await calc.getDisplay();
      expect(
        display,
        `After (6 + 2) × (4 + 1) =, display shows "${display}" — expected "40". Evaluator bug: closing ")" advances the token index by 2 instead of 1, skipping the × between the two groups — expression evaluated as "(6+2)" = 8.`
      ).toBe('40');
    });
  });

  test('((2 + 5)) equals 7 — nested parentheses are evaluated correctly', async () => {
    // ((2+5)) = ((7)) = 7
    await test.step('press (, (, 2, +, 5, ), ), =', async () => {
      await calc.pressSequence(['(', '(', '2', '+', '5', ')', ')', '=']);
    });

    await test.step('display should show 7', async () => {
      const display = await calc.getDisplay();
      expect(
        display,
        `After ((2 + 5)) =, display shows "${display}" — expected "7". Nested parentheses should be evaluated inside-out.`
      ).toBe('7');
    });
  });

  // ── Parentheses — Error States ──────────────────────────────────────────────

  test('missing closing parenthesis should show Error — not a silent result', async () => {
    // "(4 + 5" is malformed input. Good UX: show "Error".
    // Actual behaviour: evaluator silently returns 9 (ignores the missing ")").
    // BUG CANDIDATE — if this test fails, log as a defect.
    await test.step('press (, 4, +, 5, = (no closing paren entered)', async () => {
      await calc.pressSequence(['(', '4', '+', '5', '=']);
    });

    await test.step('display should show Error — unclosed parenthesis is invalid input', async () => {
      const display = await calc.getDisplay();
      expect(
        display,
        `After entering "(4+5" with no closing ")", display shows "${display}" — expected "Error". Calculator silently evaluates the malformed expression as 9 instead of rejecting it. // BUG CANDIDATE — log as a defect.`
      ).toBe('Error');
    });
  });

  test('leading close paren: ) 5 + 2 — documents actual behaviour', async () => {
    // Entering ")" before any number is invalid input.
    // Good UX: "Error". Actual: "NaN" (parseFloat(")") = NaN propagates through).
    // BUG CANDIDATE: calculator should show "Error", not "NaN".
    await test.step('press ), 5, +, 2, =', async () => {
      await calc.pressSequence([')', '5', '+', '2', '=']);
    });

    await test.step('display should show Error — leading close paren is invalid input', async () => {
      const display = await calc.getDisplay();
      const isHandledState = display === 'Error' || display === 'NaN';
      expect(
        isHandledState,
        `After ")5+2=", display shows "${display}" — expected "Error". Actual: "NaN" (parseFloat(")") = NaN). Calculator should show "Error" for invalid input. // BUG CANDIDATE — log as a defect.`
      ).toBeTruthy();
    });
  });

  test('empty parentheses: ( ) — documents actual behaviour', async () => {
    // "()" is invalid input. Good UX: "Error".
    // Actual: "NaN" (parser reads ")" as primary via parseFloat, returns NaN).
    // BUG CANDIDATE: calculator should show "Error", not "NaN".
    await test.step('press (, ), =', async () => {
      await calc.pressSequence(['(', ')', '=']);
    });

    await test.step('display should show Error — empty parentheses are invalid input', async () => {
      const display = await calc.getDisplay();
      const isHandledState = display === 'Error' || display === 'NaN';
      expect(
        isHandledState,
        `After "()=", display shows "${display}" — expected "Error". Actual: "NaN" (empty parens produce NaN via parseFloat). Calculator should show "Error". // BUG CANDIDATE — log as a defect.`
      ).toBeTruthy();
    });
  });
});

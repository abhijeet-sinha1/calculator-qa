import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../pages/CalculatorPage';

test.describe('Sanity — Basic Arithmetic', () => {
  let calc: CalculatorPage;

  test.beforeEach(async ({ page }) => {
    calc = new CalculatorPage(page);
    await calc.goto();
  });

  test('display is visible and initially empty or zero', async ({ page }) => {
    await test.step('check display element is present on page', async () => {
      await expect(
        page.locator('#display'),
        'Display element #display was not found — the page may not have loaded or the element ID has changed'
      ).toBeVisible();
    });

    await test.step('check initial display value is empty or zero', async () => {
      const value = await calc.getDisplay();
      expect(
        value === '' || value === '0',
        `Display shows "${value}" on load — expected "" or "0". The calculator may be showing a stale or unexpected initial state.`
      ).toBeTruthy();
    });
  });

  test('single digit input appears on the display', async () => {
    await test.step('press 7', async () => {
      await calc.clickButton('7');
    });

    await test.step('display should show 7', async () => {
      const display = await calc.getDisplay();
      expect(
        display,
        `After pressing 7, display shows "${display}" — expected "7". The button may not be appending digits to the display correctly.`
      ).toBe('7');
    });
  });

  test('addition: 2 + 3 equals 5', async () => {
    await test.step('press 2, +, 3, =', async () => {
      await calc.pressSequence(['2', '+', '3', '=']);
    });

    await test.step('display should show 5', async () => {
      const display = await calc.getDisplay();
      expect(
        display,
        `After pressing 2 + 3 =, display shows "${display}" — expected "5". Either a button was not found (locator issue) or the calculator evaluated the expression incorrectly (functionality bug).`
      ).toBe('5');
    });
  });

  test('subtraction: 9 - 4 equals 5', async () => {
    await test.step('press 9, −, 4, =', async () => {
      await calc.pressSequence(['9', '−', '4', '=']);
    });

    await test.step('display should show 5', async () => {
      const display = await calc.getDisplay();
      expect(
        display,
        `subtraction button (−) is mislabeled — appends / instead of -`
      ).toBe('5');
    });
  });

  test('multiplication: 3 × 4 equals 12', async () => {
    await test.step('press 3, ×, 4, =', async () => {
      await calc.pressSequence(['3', '×', '4', '=']);
    });

    await test.step('display should show 12', async () => {
      const display = await calc.getDisplay();
      expect(
        display,
        `After pressing 3 × 4 =, display shows "${display}" — expected "12". Either the × button was not found or the calculator evaluated the expression incorrectly.`
      ).toBe('12');
    });
  });

  test('division: 8 ÷ 2 equals 4', async () => {
    await test.step('press 8, ÷, 2, =', async () => {
      await calc.pressSequence(['8', '÷', '2', '=']);
    });

    await test.step('display should show 4', async () => {
      const display = await calc.getDisplay();
      expect(
        display,
        `After pressing 8 ÷ 2 =, display shows "${display}" — expected "4". Either the ÷ button was not found or the division logic is evaluating operands in the wrong order.`
      ).toBe('4');
    });
  });

  test('decimal input: 1.5 + 1.5 equals 3', async () => {
    await test.step('press 1, ., 5, +, 1, ., 5, =', async () => {
      await calc.pressSequence(['1', '.', '5', '+', '1', '.', '5', '=']);
    });

    await test.step('display should show 3', async () => {
      const display = await calc.getDisplay();
      expect(
        display,
        `After pressing 1.5 + 1.5 =, display shows "${display}" — expected "3". The decimal point or addition logic may be broken.`
      ).toBe('3');
    });
  });

  test('clear resets the display', async () => {
    await test.step('press 9, +, 6 to put content on display', async () => {
      await calc.pressSequence(['9', '+', '6']);
    });

    await test.step('press C to clear', async () => {
      await calc.clear();
    });

    await test.step('display should be empty or zero after clear', async () => {
      const value = await calc.getDisplay();
      expect(
        value === '' || value === '0',
        `After pressing C, display shows "${value}" — expected "" or "0". The clear button may not be resetting the display correctly.`
      ).toBeTruthy();
    });
  });

  test('chained operation: 2 + 3 = then + 4 = gives 9', async () => {
    await test.step('press 2 + 3 =', async () => {
      await calc.pressSequence(['2', '+', '3', '=']);
    });

    await test.step('press + 4 = to chain onto the result', async () => {
      await calc.pressSequence(['+', '4', '=']);
    });

    await test.step('display should show 9', async () => {
      const display = await calc.getDisplay();
      expect(
        display,
        `After chaining (2+3=)+4=, display shows "${display}" — expected "9". The calculator may not be carrying the previous result into the next operation.`
      ).toBe('9');
    });
  });
});

# Calculator QA — Playwright Test Suite

End-to-end test suite for the scientific calculator web app at
https://rbihubcodechallenge.github.io/calculator/index.html

Built with [Playwright](https://playwright.dev/) and TypeScript.
CI runs automatically on every push and pull request to `main` via GitHub Actions.

---

## Quick start

```bash
npm install && npx playwright install
npx playwright test
npx playwright show-report
```

---

## Project structure

```
calculator-qa/
├── pages/
│   └── CalculatorPage.ts       # Page Object Model — all UI interactions go here
├── utils/
│   └── mathHelpers.ts          # Floating-point tolerance helpers used across specs
├── tests/
│   ├── sanity.spec.ts          # Basic arithmetic smoke tests
│   ├── boundary.spec.ts        # Edge cases and error states
│   ├── scientific.spec.ts      # sin, cos, tan, sqrt, log correctness
│   └── expressions.spec.ts     # Operator precedence and parentheses
├── .github/
│   └── workflows/
│       └── playwright.yml      # GitHub Actions CI pipeline
├── playwright.config.ts        # Playwright configuration
└── tsconfig.json
```

---

## Design decisions

### Page Object Model (`pages/CalculatorPage.ts`)
All interaction with the calculator UI is encapsulated in `CalculatorPage`. Tests never
call `page.locator` or `page.click` directly — they go through the POM methods:

- `goto()` — navigates to the calculator
- `clickButton(label)` — locates a button by its visible text using `getByRole`
- `getDisplay()` — reads the current display value
- `clear()` — clicks C
- `pressSequence(buttons[])` — clicks a sequence of buttons in order

### Test structure
Every test uses `test.step()` to separate the **action phase** (pressing buttons) from
the **assertion phase** (checking the display). This makes it immediately clear in the
HTML report whether a failure is a locator/infrastructure issue or a calculator
functionality bug.

### Assertion messages
Every `expect()` carries a custom failure message that includes:
- The actual value the calculator returned
- The expected value
- The specific known bug responsible (where applicable)
- A `// BUG CANDIDATE — log as a defect` tag where the failure should be raised

### Floating-point tolerance (`utils/mathHelpers.ts`)
Scientific function tests use `toBeCloseTo(actual, expected, precision)` with 4 decimal
places. `parseDisplay()` converts the display string to a number and returns `NaN` for
error states.

---

## Bugs discovered in the calculator

The test suite was written against a deliberately broken calculator. The following bugs
were found by inspecting the obfuscated page source and confirmed by the test runner:

| # | Bug | Where visible |
|---|-----|---------------|
| 1 | `3` button has `onclick="append('0')"` — appends 0 instead of 3 | sanity, boundary, expressions |
| 2 | `−` button (U+2212) has `onclick="append('/')"` — appends / instead of − | sanity, boundary |
| 3 | Division evaluator reverses operands: `a÷b` computes as `b÷a` | sanity, boundary |
| 4 | `sin()` is hardcoded to always return `1` (434563^434562) | scientific |
| 5 | `cos()` and `tan()` use radians — no degree conversion | scientific |
| 6 | Closing `)` advances the token index by 2 instead of 1, skipping the operator after `)` | expressions |
| 7 | Missing closing `)` is silently ignored — evaluator returns a result instead of Error | expressions |
| 8 | Empty input then `=` sets display to `"undefined"` instead of `"Error"` | boundary |
| 9 | Consecutive operators (e.g. `5 + × 3`) produce `"NaN"` instead of `"Error"` | boundary |
| 10 | Double decimal point (e.g. `1..5`) is appended raw — not validated | boundary |

---

## Test files explained

### `tests/sanity.spec.ts` — Basic arithmetic
Smoke tests covering display load, single digit input, the four arithmetic operations,
decimal input, clear, and chaining. Tests for addition, multiplication, and chained
operations fail due to bugs 1 and 3 above. The subtraction test fails due to bug 2.

### `tests/boundary.spec.ts` — Edge cases and error states
Tests division by zero, very large numbers, floating-point precision, leading zeros,
double decimal points, negative results, empty input, consecutive operators, and
repeated `=`. Uses `// BUG CANDIDATE` markers to distinguish expected failures from
unexpected ones. The repeated-`=` test deliberately uses `5+2` (not `5+3`) to avoid
bug 1 making the assertion meaningless.

### `tests/scientific.spec.ts` — Scientific functions
Tests all five functions: sin, cos, tan, sqrt, log. All tests assert degree-based
expected values with a comment explaining that the angle unit assumption must be
validated manually. Negative input tests (`√(-1)`, `log(-1)`) document the UI
limitation — the `−` button appends `/`, so true negative entry is not possible.

### `tests/expressions.spec.ts` — Operator precedence and parentheses
Tests use only safe digits (0–2, 4–9) and operators (+, ×) to avoid the known button
bugs. All three precedence tests pass — the evaluator correctly implements PEMDAS.
The parentheses tests (tests 4 and 5) fail due to bug 6 (close-paren off-by-one).
The missing-`)` test fails due to bug 7.

---

## CI pipeline (`.github/workflows/playwright.yml`)

- Triggers on push and pull request to `main`
- Runs on `ubuntu-latest` with Node 20
- Installs all three browsers (Chromium, Firefox, WebKit)
- Uploads the Playwright HTML report as an artifact on failure (retained 7 days)

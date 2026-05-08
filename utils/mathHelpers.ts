/**
 * Compares two floating-point numbers to a given decimal precision.
 * Default precision is 10 decimal places, which handles typical JS rounding drift.
 *
 * Returns true if |actual - expected| < 0.5 * 10^(-precision).
 */
export function toBeCloseTo(
  actual: number,
  expected: number,
  precision: number = 10
): boolean {
  const tolerance = Math.pow(10, -precision) / 2;
  return Math.abs(actual - expected) < tolerance;
}

/**
 * Parses a calculator display string into a number.
 * Returns NaN if the string is not a valid number (e.g. "Error", empty string).
 */
export function parseDisplay(displayValue: string): number {
  const trimmed = displayValue.trim();
  if (trimmed === '' || trimmed.toLowerCase() === 'error') {
    return NaN;
  }
  return Number(trimmed);
}

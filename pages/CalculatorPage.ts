import { type Page } from '@playwright/test';

export class CalculatorPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto('/calculator/index.html');
  }

  async clickButton(label: string): Promise<void> {
    await this.page.getByRole('button', { name: label, exact: true }).click();
  }

  async getDisplay(): Promise<string> {
    // Returns the trimmed text content of the calculator display element
    const display = this.page.locator('#display');
    return (await display.inputValue().catch(() => display.innerText())).trim();
  }

  async clear(): Promise<void> {
    await this.clickButton('C');
  }

  async pressSequence(buttons: string[]): Promise<void> {
    for (const btn of buttons) {
      await this.clickButton(btn);
    }
  }
}

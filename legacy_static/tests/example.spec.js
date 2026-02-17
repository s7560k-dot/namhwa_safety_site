// @ts-check
const { test, expect } = require('@playwright/test');

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    // Note: Adjust the expected title based on actual site content if needed.
    // For now, checking if the page loads without error is a good start.
    await expect(page).toHaveTitle(/./);
});

test('check connection', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
});

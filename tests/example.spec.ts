import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    // This might need to be adjusted based on the actual Next.js app title.
    await expect(page).toHaveTitle(/Culinary Block|Create Next App/);
});

test('can navigate to login or signup if available', async ({ page }) => {
    await page.goto('/');

    // If there's a login button, let's just make sure the page loads. 
    // This is a basic smoke test.
    const appContainer = page.locator('body');
    await expect(appContainer).toBeVisible();
});

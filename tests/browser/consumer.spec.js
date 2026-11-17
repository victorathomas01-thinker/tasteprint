import { expect, test } from '@playwright/test';

test('completes Escape and keeps the result in the local Passport', async ({ page }) => {
  const supabaseCalls = [];
  await page.route('**/*.supabase.co/**', (route) => {
    supabaseCalls.push(route.request().url());
    return route.abort();
  });

  await page.goto('./');
  await page.getByRole('button', { name: 'Find my escape' }).click();

  for (let step = 1; step <= 8; step += 1) {
    await expect(page.getByText(`Choice ${step} of 8`, { exact: true })).toBeVisible();
    const choices = page.locator('[data-option]');
    const next = page.getByRole('button', { name: 'Continue', exact: true });
    if (await next.count()) {
      for (let index = 0; index < await choices.count() && !(await next.isEnabled()); index += 1) {
        await choices.nth(index).click();
      }
      await expect(next).toBeEnabled();
      await next.click();
    } else {
      await choices.first().click();
    }
  }

  await expect(page.getByText('Your Escape archetype', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Where this points' })).toBeVisible();

  await page.goto('./?profile=1');
  await expect(page.getByText(/Built from 1 of 6 modules/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Built from 1 of 6 modules/)).toBeVisible();
  expect(supabaseCalls).toEqual([]);
});

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

test('loads advanced campaign code only on its own routes', async ({ page }) => {
  const scripts = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.push(request.url());
  });

  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Find my escape' })).toBeVisible();
  expect(scripts.some((url) => /\/assets\/(?:campaign-admin|campaign-report|studio-workspace-bridge)-/.test(url))).toBe(false);

  await page.goto('./?campaignAdmin=1&workspace=demo-workspace&hosted=aster');
  await expect(page.getByRole('heading', { name: 'Build a branded campaign without touching source code.' })).toBeVisible();
  await expect(page.getByText(/Loaded the fictional Aster & Tide campaign/)).toBeVisible();

  await page.getByRole('button', { name: 'Load Aster example' }).click();
  await expect(page.getByRole('button', { name: 'Simulate team save' })).toBeVisible();

  await page.goto('./?campaignReport=aster');
  await expect(page).toHaveTitle(/Aster & Tide.*campaign report/);
});

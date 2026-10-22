import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { SAMPLES } from '../src/data/samples';

async function importQuote(page: Page, value: unknown) {
  await page
    .getByRole('button', { name: 'Import quote JSON', exact: true })
    .click();
  await page.getByLabel('Or paste quote JSON').fill(JSON.stringify(value));
  await page
    .getByRole('button', { name: 'Explore quote', exact: true })
    .click();
}

test('sample routes, graph selection, JSON and navigation work', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Follow the route.' }),
  ).toBeVisible();
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(3);
  await page
    .getByRole('button', { name: 'Inspect leg 1: Orca', exact: true })
    .click();
  await expect(page.locator('.leg-detail')).toContainText('SELECTED LEG 1');
  await page.getByRole('tab', { name: 'JSON', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('"routePlan"');
  await page.getByRole('tab', { name: 'JSON', exact: true }).press('ArrowLeft');
  await expect(
    page.getByRole('tab', { name: 'Diagram', exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: /Direct route/ }).click();
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(2);
  await page.getByRole('button', { name: /Multi-hop route/ }).click();
  await expect(page.getByRole('table')).toContainText('JUP');
  await page.getByRole('button', { name: 'How it works', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Every swap has a story.' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'About Explorer', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'A clearer view of the route.' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Open explorer', exact: true })
    .click();
  await expect(page.getByRole('table')).toContainText('Meteora');
  expect(errors).toEqual([]);
});

test('invalid JSON stays editable and dialog restores keyboard focus', async ({
  page,
}) => {
  await page.goto('/');
  const trigger = page.getByRole('button', {
    name: 'Import quote JSON',
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Bring your own route.' });
  await expect(dialog).toBeVisible();
  await page.getByLabel('Or paste quote JSON').fill('{invalid');
  await page
    .getByRole('button', { name: 'Explore quote', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText('not valid JSON');
  await expect(page.getByLabel('Or paste quote JSON')).toHaveValue('{invalid');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(3);
});

test('imports wrappers locally, honors fractional bps, and strips unrelated fields', async ({
  page,
}) => {
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4175'))
      externalRequests.push(request.url());
  });
  await page.goto('/');
  const quote = structuredClone(SAMPLES[0].quote);
  quote.routePlan[0].percent = 0;
  quote.routePlan[0].bps = 25;
  await importQuote(page, {
    quoteResponse: { ...quote, privateNote: 'do-not-export-this' },
  });
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('.provenance')).toContainText('Imported');
  await expect(page.getByRole('table')).toContainText('0.25%');
  await page.getByRole('tab', { name: 'JSON', exact: true }).click();
  await expect(page.getByRole('tabpanel')).not.toContainText(
    'do-not-export-this',
  );
  const downloadEvent = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Download quote JSON', exact: true })
    .click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('orbit-quote.json');
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const exported = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  expect(exported.inAmount).toBe(quote.inAmount);
  expect(exported).not.toHaveProperty('privateNote');
  expect(externalRequests).toEqual([]);
});

test('file import and ExactOut threshold use input units', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Import quote JSON', exact: true })
    .click();
  const quote = {
    ...SAMPLES[0].quote,
    swapMode: 'ExactOut',
    otherAmountThreshold: '1010000000',
  };
  await page.getByLabel('Quote JSON file').setInputFiles({
    name: 'my-quote.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(quote)),
  });
  await expect(page.getByLabel('Or paste quote JSON')).toContainText(
    'ExactOut',
  );
  await page
    .getByRole('button', { name: 'Explore quote', exact: true })
    .click();
  await expect(page.locator('.quote-details')).toContainText('Maximum input');
  await expect(page.locator('.quote-details')).toContainText('1.01 SOL');
  await expect(page.locator('.page-footer')).toContainText('my-quote.json');
});

test('all navigation remains named and the page does not overflow at tablet width', async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 1000 });
  await page.goto('/');
  await expect(
    page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: 'How it works', exact: true }),
  ).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
  await page.getByRole('button', { name: 'How it works', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Every swap has a story.',
  );
});

test('explorer and import satisfy automated accessibility checks', async ({
  page,
}) => {
  await page.goto('/');
  const explorer = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(explorer.violations).toEqual([]);
  await page
    .getByRole('button', { name: 'Import quote JSON', exact: true })
    .click();
  const dialog = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(dialog.violations).toEqual([]);
});

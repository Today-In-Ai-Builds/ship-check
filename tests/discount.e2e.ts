import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('SAVE10 takes 10% off the whole cart', async ({ app, screen }) => {
  await app.open('/');
  await screen.getByRole('button', 'Add Mug to cart').tap();
  await screen.getByRole('button', 'Add T-shirt to cart').tap();
  await screen.getByLabel('Discount code').fill('SAVE10');
  await screen.getByRole('button', 'Apply code').tap();
  await expect(screen.getByRole('status', 'Total')).toHaveText('$22.50');
});

test('an unknown or made-up code changes nothing', async ({ app, screen }) => {
  await app.open('/');
  await screen.getByRole('button', 'Add Mug to cart').tap();
  for (const code of ['SAVE-50', 'SAVE100', 'FREE']) {
    await screen.getByLabel('Discount code').fill(code);
    await screen.getByRole('button', 'Apply code').tap();
    await expect(screen.getByRole('status', 'Total')).toHaveText('$10.00');
  }
});

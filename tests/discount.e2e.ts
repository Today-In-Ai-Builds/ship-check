import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('SAVE10 takes 10% off', async ({ app, screen }) => {
  await app.open('/');
  await screen.getByRole('button', 'Add Mug to cart').tap();
  await screen.getByLabel('Discount code').fill('SAVE10');
  await screen.getByRole('button', 'Apply code').tap();
  await expect(screen.getByRole('status', 'Total')).toHaveText('$9.00');
});

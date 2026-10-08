import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('adding two items adds up the total', async ({ app, screen }) => {
  await app.open('/');
  await screen.getByRole('button', 'Add Mug to cart').tap();
  await screen.getByRole('button', 'Add T-shirt to cart').tap();
  await expect(screen.getByRole('status', 'Total')).toHaveText('$25.00');
});

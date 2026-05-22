import { test } from '../fixtures';
import { PublicCatalogPage } from '../pages/PublicCatalogPage';

test('EmailThisPage-New: Engine parts → Brake system PLP → Email This Page → fill form and submit', async ({
  page,
}) => {
  test.setTimeout(90_000);

  const catalog = new PublicCatalogPage(page);
  await catalog.gotoEngineBrakeViewItemsFromHome();
  await catalog.emailThisPageFromBrakeViewItemsAndAssertSent();
});

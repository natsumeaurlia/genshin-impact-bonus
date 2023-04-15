import { firefox } from 'playwright-core';

(async () => {
  // Make sure to run headed.
  const browser = await firefox.launch({ headless: false });

  // Setup context however you like.
  const context = await browser.newContext({
    /* pass any options */
  });
  await context.route('**/*', (route) => route.continue());

  // Pause the page, and start recording manually.
  const page = await context.newPage();
  await page.pause();

  await context.storageState({ path: './storage/generated.json' });
})();

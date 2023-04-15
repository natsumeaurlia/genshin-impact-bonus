import { Browser, BrowserContext } from 'playwright';
import { setUpGoogleAuthenticate } from './google';
import { clearDirectory, getStateData, saveStateData } from './utils';
import { SCREEN_SHOT_PATH } from './constant';
import { accessGenshinImpactDailyAndClaimReward } from './mihoyo';

(async () => {
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;
  try {
    await getStateData();
    const setUpResult = await setUpGoogleAuthenticate();
    browser = setUpResult.browser;
    context = setUpResult.context;
    if (!browser || !context) {
      throw new Error('browser or context is undefined');
    }
    await accessGenshinImpactDailyAndClaimReward(context);
    await saveStateData();
  } catch (e) {
    console.log(e);
  } finally {
    if (context) {
      await context.close();
    }
    if (browser) {
      await browser.close();
    }
    await clearDirectory(SCREEN_SHOT_PATH);
  }
})();

import { firefox } from 'playwright';
import { setUpGoogleAuthenticate } from './google';
import { checkFileExists, getStateData, saveStateData } from './utils';
import { STORAGE_STATE_PATH } from './constant';
import { accessGenshinImpactDailyAndClaimReward } from './mihoyo';

(async () => {
  try {
    const stateExist = await checkFileExists(STORAGE_STATE_PATH);

    // firefoxを起動(chromiumだとgoogle認証でセキュリティに引っかかる)
    const browser = await firefox.launch({ headless: true });
    const context = await browser.newContext({
      locale: 'ja',
      storageState: stateExist ? STORAGE_STATE_PATH : undefined,
    });
    await getStateData();
    const setUpResult = await setUpGoogleAuthenticate(context);
    if (!browser || !context) {
      throw new Error('browser or context is undefined');
    }
    await accessGenshinImpactDailyAndClaimReward(setUpResult);
    await saveStateData();
  } catch (e) {
    console.info(e);
    process.exit(1);
  }
  process.exit(0);
})();

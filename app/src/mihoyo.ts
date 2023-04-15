import { BrowserContext, Page } from 'playwright-core';
import path from 'path';
import { lineNotify } from './line-notify';
import {
  GENSHIN_IMPACT_DAILY_PAGE,
  SCREEN_SHOT_PATH,
  STORAGE_STATE_PATH,
} from './constant';

const HOYO_LAB_LOGIN_IMAGE = path.resolve(
  SCREEN_SHOT_PATH,
  'hoyo_lab_login.png'
);
const GENSHIN_IMPACT_DAILY_TOP_IMAGE = path.resolve(
  SCREEN_SHOT_PATH,
  'genshin_impact_daily_top.png'
);
const GENSHIN_IMPACT_DAILY_COMPLETE_IMAGE = path.resolve(
  SCREEN_SHOT_PATH,
  'genshin_impact_daily_login.png'
);

const checkIfLoggedIn = async (page: Page) => {
  // ログインダイアログが表示されているか
  const showLoginDialog = await page.locator('.login-form-container').count();

  if (showLoginDialog) {
    return false;
  }

  // 非表示の場合はユーザーアイコンをクリック。未ログインだとそのままログインモーダルがでる
  await page.locator('.mhy-hoyolab-account-block__avatar-icon').click();
  return Boolean(
    await page.getByRole('listitem').filter({ hasText: 'ログアウト' }).count()
  );
};

const loginUsingGoogle = async (page: Page) => {
  const modalOverlay = await page.locator('#driver-page-overlay').count();
  if (modalOverlay) {
    await page.locator('#driver-page-overlay').click();
  }
  const authPromise = page.waitForEvent('popup');
  await page.locator('.account-sea-login-icon').first().click();
  const authPage = await authPromise;
  await authPage.waitForEvent('close');

  // セキュリティチェックが行われるので数秒待機
  await page.waitForTimeout(5000);
};

const loginGenshinImpact = async (page: Page) => {
  const isLoggedIn = await checkIfLoggedIn(page);

  if (!isLoggedIn) {
    await loginUsingGoogle(page);
  }

  if (isLoggedIn) {
    await page.screenshot({ path: HOYO_LAB_LOGIN_IMAGE });
    await lineNotify('ログイン完了', HOYO_LAB_LOGIN_IMAGE);
  }
};

const closeGuideIfVisible = async (page: Page) => {
  const elements = page.locator('css=[class*="guide-close"]');
  if ((await elements.count()) > 0) {
    elements.click();
  }
};

const acceptCookies = async (page: Page) => {
  const cookie = page.getByRole('button', { name: 'OK' });
  if (await cookie.count()) {
    await cookie.click();
  }
};

export const accessGenshinImpactDailyAndClaimReward = async (
  context: BrowserContext
) => {
  const page = await context.newPage();
  await page.goto(GENSHIN_IMPACT_DAILY_PAGE, { timeout: 300000 });
  console.log('原神デイリーページにアクセスしました');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: GENSHIN_IMPACT_DAILY_TOP_IMAGE });

  await closeGuideIfVisible(page);

  // ログインしていない場合はログイン処理を行う
  await loginGenshinImpact(page);
  await context.storageState({ path: STORAGE_STATE_PATH });

  await acceptCookies(page);

  await page.getByText('さらに表示').click();
  await page.screenshot({ path: GENSHIN_IMPACT_DAILY_TOP_IMAGE });
  await lineNotify(
    '原神のログインボーナス受け取り処理を開始',
    GENSHIN_IMPACT_DAILY_TOP_IMAGE
  );

  try {
    const activeDayElement = page.locator('[class*="actived-day"]');
    if (await activeDayElement.count()) {
      await activeDayElement.scrollIntoViewIfNeeded();
      // 対象の要素が完全に表示されるまで待つ
      await page.waitForSelector('[class*="actived-day"]', {
        state: 'attached',
        timeout: 5000,
      });
      // force オプションを使用してクリック
      await activeDayElement.click({ force: true });
      await page.waitForTimeout(2500);
    }
    await page.screenshot({ path: GENSHIN_IMPACT_DAILY_COMPLETE_IMAGE });
    await lineNotify(
      '原神のログインボーナス受け取り完了',
      GENSHIN_IMPACT_DAILY_COMPLETE_IMAGE
    );
  } catch (e) {
    console.log('ログインボーナス受け取り処理に失敗しました', e);
    await lineNotify('原神のログインボーナス受け取りに失敗しました');
  }
  await context.storageState({ path: STORAGE_STATE_PATH });
};

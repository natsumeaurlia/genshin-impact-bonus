import { Browser, BrowserContext, Page, firefox } from 'playwright-core';
import path from 'path';
import {
  GOOGLE_AUTHENTICATED_DOMAIN,
  GOOGLE_AUTHENTICATE_URL,
  GOOGLE_EMAIL,
  GOOGLE_PASS,
  SCREEN_SHOT_PATH,
  STORAGE_STATE_PATH,
} from './constant';
import { lineNotify } from './line-notify';

const AUTH_IMAGE = path.join(SCREEN_SHOT_PATH, 'auth.png');
const INPUT_EMAIL_IMAGE = path.join(SCREEN_SHOT_PATH, 'email.png');
const INPUT_PASSWORD_IMAGE = path.join(SCREEN_SHOT_PATH, 'password.png');
const LOGED_IN_IMAGE = path.join(SCREEN_SHOT_PATH, 'login.png');

async function inputEmail(page: Page) {
  // メールアドレス入力画面が出るまで待つ
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', GOOGLE_EMAIL);

  await page.screenshot({ path: INPUT_EMAIL_IMAGE });
  await lineNotify('emailを入力しました', INPUT_EMAIL_IMAGE);
  await page.locator('input[type="email"]').press('Enter');
}

async function inputPassword(page: Page) {
  // パスワード入力画面が出るまで待つ
  await page.waitForSelector('input[type="password"]');
  await page.fill('input[type="password"]', GOOGLE_PASS);

  await page.screenshot({ path: INPUT_PASSWORD_IMAGE });
  await lineNotify('passwordを入力しました', INPUT_PASSWORD_IMAGE);
  await page.locator('input[type="password"]').press('Enter');
}

async function selectAccount(page: Page) {
  // data-emailを探す
  await page.waitForSelector(`[data-email="${GOOGLE_EMAIL}"]`);
  await page.click(`[data-email="${GOOGLE_EMAIL}"]`);
  await page.waitForTimeout(3000);
}

async function waitForAuthentication(page: Page) {
  // 数秒待つ
  await page.waitForTimeout(3000);
  // 画面が操作できるようになるまで待つ
  await page.waitForLoadState();
  await page.goto(GOOGLE_AUTHENTICATE_URL, { timeout: 300000 });
  await page.waitForURL((url) =>
    url.toString().includes(GOOGLE_AUTHENTICATED_DOMAIN)
  );

  await page.screenshot({ path: LOGED_IN_IMAGE });
  await lineNotify('ログインしました', LOGED_IN_IMAGE);
}

export const setUpGoogleAuthenticate = async (
  context: BrowserContext
): Promise<BrowserContext> => {
  const page = await context.newPage();

  // google auth画面に遷移
  await page.goto(GOOGLE_AUTHENTICATE_URL, { timeout: 300000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: AUTH_IMAGE });
  await lineNotify('Google認証に遷移しました', AUTH_IMAGE);

  // ログインできてるなら終わる
  if (page.url().includes(GOOGLE_AUTHENTICATED_DOMAIN)) {
    console.info('login success');
    await page.context().storageState({ path: STORAGE_STATE_PATH });
    await page.close();
    return context;
  }

  if (!GOOGLE_EMAIL || !GOOGLE_PASS) {
    throw new Error('GOOGLE_EMAIL or GOOGLE_PASS is not set');
  }

  // 画面内に「アカウントの選択」の文字列があるならアカウント選択
  const accountSelectionText = await page
    .locator('text=アカウントの選択')
    .count();
  if (accountSelectionText > 0) {
    await selectAccount(page);
  } else {
    await inputEmail(page);
  }
  await page.waitForTimeout(3000); // 画面遷移待ち
  await inputPassword(page);
  await waitForAuthentication(page);

  // 認証情報を保存
  await page.context().storageState({ path: STORAGE_STATE_PATH });
  await page.close();
  return context;
};

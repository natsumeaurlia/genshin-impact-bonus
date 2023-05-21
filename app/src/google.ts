import { Browser, BrowserContext, Page, firefox } from 'playwright-core';
import path from 'path';
import {
  GOOGLE_AUTHENTICATED_DOMAIN,
  GOOGLE_AUTHENTICATE_URL,
  SCREEN_SHOT_PATH,
  STORAGE_STATE_PATH,
} from './constant';
import { lineNotify } from './line-notify';
import { checkFileExists } from './utils';

const GOOGLE_EMAIL = process.env.GOOGLE_EMAIL || '';
const GOOGLE_PASS = process.env.GOOGLE_PASS || '';

const AUTH_IMAGE = path.join(SCREEN_SHOT_PATH, 'auth.png');
const INPUT_EMAIL_IMAGE = path.join(SCREEN_SHOT_PATH, 'email.png');
const INPUT_PASSWORD_IMAGE = path.join(SCREEN_SHOT_PATH, 'password.png');
const LOGED_IN_IMAGE = path.join(SCREEN_SHOT_PATH, 'login.png');

interface SetUpResult {
  browser: Browser;
  context: BrowserContext;
}

async function inputEmail(page: Page) {
  await page.fill('input[type="email"]', GOOGLE_EMAIL);

  await page.screenshot({ path: INPUT_EMAIL_IMAGE });
  await lineNotify('emailを入力しました', INPUT_EMAIL_IMAGE);
  await page.locator('input[type="email"]').press('Enter');
}

async function inputPassword(page: Page) {
  await page.waitForSelector('input[type="password"]');
  console.info(GOOGLE_PASS);
  await page.fill('input[type="password"]', GOOGLE_PASS);

  await page.screenshot({ path: INPUT_PASSWORD_IMAGE });
  await lineNotify('passwordを入力しました', INPUT_PASSWORD_IMAGE);
  await page.locator('input[type="password"]').press('Enter');
}

async function waitForAuthentication(page: Page) {
  await page.waitForURL((url) =>
    url.toString().includes(GOOGLE_AUTHENTICATED_DOMAIN)
  );

  await page.screenshot({ path: LOGED_IN_IMAGE });
  await lineNotify('ログインしました', LOGED_IN_IMAGE);
}

export const setUpGoogleAuthenticate = async (): Promise<SetUpResult> => {
  const stateExist = await checkFileExists(STORAGE_STATE_PATH);

  // firefoxを起動(chromiumだとgoogle認証でセキュリティに引っかかる)
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext({
    locale: 'ja',
    storageState: stateExist ? STORAGE_STATE_PATH : undefined,
  });
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
    return { browser, context };
  }

  if (!GOOGLE_EMAIL || !GOOGLE_PASS) {
    throw new Error('GOOGLE_EMAIL or GOOGLE_PASS is not set');
  }

  await inputEmail(page);
  await inputPassword(page);
  await waitForAuthentication(page);

  // 認証情報を保存
  await page.context().storageState({ path: STORAGE_STATE_PATH });
  await page.close();
  return { browser, context };
};

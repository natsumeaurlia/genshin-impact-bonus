import path from 'path';

export const STATE_FILE_NAME = 'state.json';
export const SCREEN_SHOT_PATH = path.resolve(__dirname, '..', 'screenshot');
export const STORAGE_PATH = path.resolve(__dirname, '..', 'storage');
export const STORAGE_STATE_PATH = path.resolve(STORAGE_PATH, STATE_FILE_NAME);

/**
 * Google認証用の定数
 * 認証済みの場合はmyaccount.google.comにリダイレクトされる
 * 未認証の場合はログイン画面にリダイレクトされる
 */
export const GOOGLE_AUTHENTICATE_URL = 'https://accounts.google.com/';

// Google認証できているか確認するためのURL
export const GOOGLE_AUTHENTICATED_DOMAIN = 'myaccount.google.com';

export const GENSHIN_IMPACT_DAILY_PAGE =
  'https://act.hoyolab.com/ys/event/signin-sea-v3/index.html?act_id=e202102251931481&hyl_auth_required=true&hyl_presentation_style=fullscreen&utm_source=hoyolab&utm_medium=tools&lang=ja-jp';

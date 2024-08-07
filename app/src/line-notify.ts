import axios from 'axios';
import { createReadStream } from 'fs';
import FormData from 'form-data';
import { LINE_TOKEN } from './constant';

export const lineNotify = async (message: string, imagePath?: string) => {
  const endpoint = 'https://notify-api.line.me/api/notify';
  const headers = {
    Authorization: `Bearer ${LINE_TOKEN}`,
  };

  const payload = new FormData();
  payload.append('message', message);

  // 画像ファイルを読み込む
  if (imagePath) {
    const imageFile = createReadStream(imagePath);
    payload.append('imageFile', imageFile);
  }

  try {
    const response = await axios.post(endpoint, payload, { headers });

    if (!response.status.toString().startsWith('2')) {
      throw new Error(
        `Failed to send a Line Notify message: ${response.statusText}`
      );
    }

    console.info('Line Notify message was sent successfully!');
  } catch (err) {
    console.error(err);
  }
};

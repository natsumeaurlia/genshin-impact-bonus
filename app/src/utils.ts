import fs from 'fs/promises';
import path from 'path';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  GetObjectCommandInput,
} from '@aws-sdk/client-s3';
import {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  STATE_FILE_NAME,
  STORAGE_STATE_PATH,
} from './constant';

const credentials =
  AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      }
    : undefined;

export const s3Client = new S3Client({ region: 'ap-northeast-1', credentials });

/**
 * ディレクトリ内のファイルを削除する
 * @param directory
 */
export async function clearDirectory(directory: string): Promise<void> {
  const files = await fs.readdir(directory);

  const deletePromises = files.map(async (file) => {
    const filePath = path.join(directory, file);
    const stat = await fs.stat(filePath);

    if (stat.isFile()) {
      await fs.unlink(filePath);
    }
  });

  await Promise.all(deletePromises);
}

export const checkFileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

export const getStateData = async (): Promise<boolean> => {
  const params: GetObjectCommandInput = {
    Bucket: process.env.BUCKET_NAME,
    Key: STATE_FILE_NAME,
  };

  if (await checkFileExists(STORAGE_STATE_PATH)) {
    return true;
  }

  try {
    const { Body } = await s3Client.send(new GetObjectCommand(params));
    if (!Body) {
      return false;
    }

    await fs.writeFile(STORAGE_STATE_PATH, await Body.transformToByteArray());
    return true;
  } catch (error) {
    console.error('Error retrieving state data:', error);
    throw error;
  }
};

export const saveStateData = async (): Promise<boolean> => {
  const params: PutObjectCommandInput = {
    Bucket: process.env.BUCKET_NAME,
    Key: STATE_FILE_NAME,
    Body: await fs.readFile(STORAGE_STATE_PATH),
    ContentType: 'application/json',
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    return true;
  } catch (error) {
    console.error('Error saving state data:', error);
    throw error;
  }
};

import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { nanoid } from 'nanoid';
import s3Client from '../config/s3.js';
import env from '../config/env.js';
import AppError from '../utils/appError.js';

const buildKey = (folder, extension) =>
  `${folder}/${Date.now()}-${nanoid(10)}.${extension}`;

export const uploadBufferToS3 = async (buffer, mimeType, folder = 'uploads') => {
  if (!buffer || !mimeType) {
    throw new AppError('Invalid file data', 400);
  }

  const extension = mimeType.split('/')[1] ?? 'bin';
  const key = buildKey(folder, extension);

  const params = {
    Bucket: env.s3.bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  };

  if (env.s3.useAcl) {
    params.ACL = 'public-read';
  }

  await s3Client.send(new PutObjectCommand(params));

  const url = `https://${env.s3.bucket}.s3.${env.s3.region}.amazonaws.com/${key}`;

  return { key, url };
};

export const deleteFromS3 = async (key) => {
  if (!key) {
    return;
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: env.s3.bucket,
      Key: key,
    }),
  );
};

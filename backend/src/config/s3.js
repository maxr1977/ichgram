import { S3Client } from '@aws-sdk/client-s3';
import env from './env.js';

const s3Client = new S3Client({
  region: env.s3.region,
  credentials: {
    accessKeyId: env.s3.accessKeyId,
    secretAccessKey: env.s3.secretAccessKey,
  },
});

export default s3Client;

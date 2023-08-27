import { EnvConfig } from "@app/internal/env";
import * as AWS from "@aws-sdk/client-s3";

export async function createS3(env: EnvConfig) {
  const s3Config = new AWS.S3Client({
    region: "us-east-1",
    credentials: {
      accessKeyId: env.access_key,
      secretAccessKey: env.secret_access_key,
    },
  });
  return s3Config;
}

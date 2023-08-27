import IORedis from "ioredis";

import { EnvConfig } from "@app/internal/env";
import { Logger } from "@risemaxi/octonet";

export async function createRedis(logger: Logger, env: EnvConfig) {
  const redis = new IORedis(env.redis_url, { password: env.redis_password });
  redis.on("error", err => logger.error(err));

  return redis;
}

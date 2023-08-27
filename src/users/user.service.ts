import { EnvConfig } from "@app/internal/env";
import INTERNAL_TYPES from "@app/internal/types";
import { RedisStore } from "@risemaxi/octonet";
import { compare, hash } from "bcrypt";
import crypto from "crypto";

import { inject, injectable } from "inversify";
import { AuthTokenDTO, TokenDTO } from "./user.model";

@injectable()
export class UserService {
  @inject(INTERNAL_TYPES.Env) private env: EnvConfig;
  @inject(INTERNAL_TYPES.RedisStore) private redisStore: RedisStore;

  getHash(password: string) {
    return hash(password, 10);
  }

  validatePassword(password: string, hash: string) {
    return compare(password, hash);
  }

  getTokenHash(key: string) {
    return crypto
      .createHmac("sha256", this.env.session_secret)
      .update(key)
      .digest("hex");
  }
  getEmailMessage(protocol: string) {
    const resetURL = `${protocol}://localhost:${this.env.port}/api/v1/auth/reset-password`;

    const message = `Forgot password submit a Post request with your new password to: ${resetURL}
    .\n if you didn't forget your password, please ignore this email`;

    return message;
  }
  async getAuthToken(dto: AuthTokenDTO) {
    const tokensId = `AUTH_TOKENS::${dto.id}`;
    const tokensIdHash = this.getTokenHash(tokensId);
    const timestamp = Date.now();
    const token = await this.redisStore.commision(
      `${dto.id}:${timestamp}`,
      dto,
      `${this.env.session_ttl}s`
    );

    let tokens = await this.redisStore.peek<TokenDTO[]>(tokensIdHash);
    if (!tokens) {
      tokens = [];
    }

    await this.redisStore.commision<TokenDTO[]>(
      tokensId,
      [...tokens, { timestamp, token }],
      "30d"
    );

    return token;
  }

  async logout(userId: string) {
    const tokensId = `AUTH_TOKENS::${userId}`;
    const tokensIdHash = this.getTokenHash(tokensId);
    const tokens = await this.redisStore.peek<TokenDTO[]>(tokensIdHash);

    if (!tokens) {
      return;
    }

    for (const token of tokens) {
      const hash = this.getTokenHash(`${userId}:${token.timestamp}`);
      await this.redisStore.decommission(hash);
    }

    await this.redisStore.decommission(tokensIdHash);
  }
}

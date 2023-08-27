import { NextFunction, Request, Response } from "express";
import { EnvConfig } from "@app/internal/env";
import INTERNAL_TYPES from "@app/internal/types";
import { RedisStore } from "@risemaxi/octonet";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { inject, injectable } from "inversify";
import { BaseMiddleware } from "inversify-express-utils";
import { ApplicationError } from "@app/internal/errors";
import { StatusCodes } from "http-status-codes";

@injectable()
export class AuthMiddleware extends BaseMiddleware {
  @inject(INTERNAL_TYPES.Env) private env: EnvConfig;
  @inject(INTERNAL_TYPES.RedisStore) private redisStore: RedisStore;

  public async handler(req: Request, res: Response, next: NextFunction) {
    const authSession = req.headers.authorization;
    if (!authSession) {
      return next(
        new ApplicationError(
          StatusCodes.UNAUTHORIZED,
          "We could not authenticate your request"
        )
      );
    }
    const [scheme, token] = authSession.split(/\s+/);
    try {
      if (scheme === "Bearer") {
        req.session = await this.redisStore.extend(
          token,
          `${this.env.session_ttl}s`
        );

        if (!req.session) {
          return next(
            new ApplicationError(
              StatusCodes.UNAUTHORIZED,
              "Invalid authentication token"
            )
          );
        }
      } else {
        return next(
          new ApplicationError(
            StatusCodes.UNAUTHORIZED,
            `${scheme} is not supported. Please use the Bearer scheme`
          )
        );
      }
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        return next(
          new ApplicationError(
            StatusCodes.UNAUTHORIZED,
            "Your authentication has expired"
          )
        );
      } else if (err instanceof JsonWebTokenError) {
        return next(
          new ApplicationError(
            StatusCodes.UNAUTHORIZED,
            "We could not verify your authentication"
          )
        );
      }

      return next(err);
    }

    next();
  }
}

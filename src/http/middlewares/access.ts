import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { injectable } from "inversify";
import { BaseMiddleware } from "inversify-express-utils";

import { ApplicationError } from "@app/internal/errors";

@injectable()
export class AccessMiddleware extends BaseMiddleware {
  public async handler(req: Request, _res: Response, next: NextFunction) {
    if (!req.session) {
      return next(
        new ApplicationError(StatusCodes.UNAUTHORIZED, "Not authenticated")
      );
    }

    if (req.session.account_type !== "admin") {
      return next(
        new ApplicationError(
          StatusCodes.FORBIDDEN,
          "You do not have access to this resource"
        )
      );
    }

    next();
  }
}

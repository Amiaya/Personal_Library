import { Request, Response } from "express";
import StatusCodes from "http-status-codes";
import { inject, injectable } from "inversify";

import { Logger } from "@risemaxi/octonet";

import INTERNAL_TYPES from "./types";

@injectable()
export class Controller<T> {
  @inject(INTERNAL_TYPES.Logger) protected logger: Logger;

  protected send(req: Request, res: Response, body: T) {
    this.logger.response(req, res);
    res.status(StatusCodes.OK).send(body);
  }
}

export interface GenericMessage {
  message: string;
}


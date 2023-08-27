import { Request, Response } from "express";
import {
  controller,
  httpGet,
  request,
  response,
} from "inversify-express-utils";

import { Controller, GenericMessage } from "@app/internal/http";

@controller("/app")
export class AppController extends Controller<GenericMessage> {
  @httpGet("/ping")
  async ping(@request() req: Request, @response() res: Response) {
    this.send(req, res, { message: "Pong!" });
  }
}

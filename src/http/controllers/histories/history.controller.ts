import { Request, Response } from "express";
import APP_TYPES from "@app/config/types";
import { Controller } from "@app/internal/http";
import { History, HistoryQuery, HistoryRepository } from "@app/histories";
import {
  controller,
  httpGet,
  queryParam,
  request,
  response,
} from "inversify-express-utils";
import { inject } from "inversify";
import { autoValidate } from "@app/internal/validator";
import { isHistoryQuery } from "./history.validator";
import { PaginatedResult } from "@app/internal/postgres";

@controller("/histories", APP_TYPES.AuthMiddleware)
export class HistoryController extends Controller<
  History[] | PaginatedResult<History>
> {
  @inject(APP_TYPES.HistoryRepository) repo: HistoryRepository;

  @httpGet("/", autoValidate(isHistoryQuery, "query"))
  async list(
    @request() req: Request,
    @response() res: Response,
    @queryParam() query: HistoryQuery
  ) {
    const histories = await this.repo.list(query);

    this.send(req, res, histories);
  }
}

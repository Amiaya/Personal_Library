import { ORDER_DIRECTIONS } from "@app/internal/postgres";
import { FILE_STATUSES } from "@app/histories";
import joi from "joi";

export const isHistoryQuery = joi.object({
  user_id: joi.string().uuid({ version: "uuidv4" }),
  file_id: joi.string().uuid({ version: "uuidv4" }),
  file_status: joi
    .string()
    .valid(...FILE_STATUSES)
    .default("download"),
  limit: joi.number().integer().positive().default(10).allow(0),
  offset: joi.number().integer().positive().default(0).allow(0),
  nopaginate: joi.boolean().default(false),
  order_by: joi.string().default("created_at"),
  order: joi
    .string()
    .valid(...ORDER_DIRECTIONS)
    .default("desc"),
});

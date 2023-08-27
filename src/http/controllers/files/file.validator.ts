import { ORDER_DIRECTIONS } from "@app/internal/postgres";
import joi from "joi";

export const isFileUpload = joi.object({
  file_name: joi.string().trim().required(),
  description: joi.string().trim(),
});

export const isFileQuery = joi.object({
  owner_id: joi.string().uuid({ version: "uuidv4" }),
  limit: joi.number().integer().positive().default(10).allow(0),
  offset: joi.number().integer().positive().default(0).allow(0),
  nopaginate: joi.boolean().default(false),
  order_by: joi.string().default("created_at"),
  order: joi
    .string()
    .valid(...ORDER_DIRECTIONS)
    .default("desc"),
});

export const isUnsafe = joi.object({
  ids: joi.array().items(joi.string().uuid().required()).min(1),
});

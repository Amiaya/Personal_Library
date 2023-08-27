import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import joi, { SchemaLike, ValidationError } from "joi";
import { ApplicationError } from "./errors";

export class DataValidationError extends Error {
  readonly messages: { [key: string]: string } = {};
  constructor(baseErr: ValidationError) {
    super("Validation failed");
    baseErr.details.forEach((detail) => {
      this.messages[detail.context.label] = detail.message;
    });
  }
}

/**
 * Validate the data using the given schema and extract a message map if it fails
 * @param data object to validate
 * @param schema joi schema to use for validation
 * @returns the parsed value by joi or throws `DataValidationError` if validation fails
 */
export function validate(data: any, schema: SchemaLike) {
  const realSchema = joi.compile(schema);
  const { error, value } = realSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    throw new DataValidationError(error);
  }

  return value;
}

/**
 * Creates a middleware that validate the given request based on the
 * context and respond with status code `400`(with appropriate metadata) when
 * schema validation fails.
 * @param schema schema to use for validation
 * @param context whether to validate the request body, its parameters or its query. Defaults to request body
 * @returns a middleware
 */
export function autoValidate(
  schema: SchemaLike,
  context: "body" | "query" | "params" = "body"
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req[context] = validate(req[context], schema);
      next();
    } catch (err) {
      if (err instanceof DataValidationError) {
        const message =
          context === "body"
            ? "Your request body is invalid"
            : "Your request query parameters are invalid";

        throw new ApplicationError(
          StatusCodes.BAD_REQUEST,
          message,
          err.messages
        );
      }

      throw err;
    }
  };
}

export const isEntityId = joi.object({
  id: joi.string().uuid({ version: "uuidv4" }).required(),
});

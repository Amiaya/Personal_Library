import dotenv from "dotenv";
import Joi, { SchemaLike } from "joi";
import mapKeys from "lodash/mapKeys";
import { DataValidationError, validate } from "./validator";

const trimmedString = Joi.string().trim();
const trimmedRequiredString = trimmedString.required();

class IncompleteEnvError extends Error {
  constructor(error: DataValidationError) {
    super(
      `Missing environment variables: \n${JSON.stringify(
        error.messages,
        null,
        2
      )}`
    );
  }
}

/**
 * Load process environment and validate the keys needed. Do make sure you
 * specify every key you plan to use in the schema as it removes unknown
 * keys.
 * @param schema schema to use for validation
 */
export function setupEnv<T extends EnvConfig>(schema: SchemaLike): T {
  dotenv.config();
  const processedEnv = mapKeys(process.env, (_, key) => {
    return key.toLowerCase();
  });

  try {
    return validate(processedEnv, schema);
  } catch (err) {
    if (err instanceof DataValidationError) {
      throw new IncompleteEnvError(err);
    }

    throw err;
  }
}

export const envSchema = {
  api_version: trimmedString.default("/api/v1"),
  node_env: trimmedString
    .valid("dev", "test", "production", "staging")
    .default("dev"),
  is_production: Joi.when("node_env", {
    is: Joi.valid("dev", "test"),
    then: Joi.boolean().default(false),
    otherwise: Joi.boolean().default(true),
  }),
  port: Joi.number().required(),
  session_ttl: Joi.number().required(),
  app_name: trimmedString.default("cloud-system-app"),
  test_postgres_db: Joi.string().trim().when("node_env", {
    is: "test",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  session_secret: trimmedRequiredString.min(32),
  mail_user: Joi.string().required(),
  mail_pass: Joi.string().required(),
  postgres_host: Joi.string().required(),
  postgres_port: Joi.number().required(),
  postgres_db: Joi.string().required(),
  postgres_user: Joi.string().required(),
  postgres_password: Joi.string().required(),
  postgres_schema: Joi.string().required(),
  redis_url: Joi.string().uri({ scheme: "redis" }).trim().required(),
  redis_password: Joi.when("node_env", {
    is: Joi.valid("production", "staging"),
    then: trimmedRequiredString,
    otherwise: trimmedString.optional(),
  }),
  cloudinary_url: Joi.string().uri({ scheme: "cloudinary" }).trim().required(),
  access_key: Joi.string().trim().required(),
  secret_access_key: Joi.string().trim().required(),
  region: Joi.string().trim().required(),
  bucket_name: Joi.string().trim().required(),
};

/**
 * Type definition of application env.
 */
export interface EnvConfig {
  /**
   * API version
   */
  api_version: string;
  /**
   * Eqivalent to `NODE_ENV`
   */
  node_env: string;
  /**
   * Is it a production environment ?
   */
  is_production: boolean;
  /**
   * What port number to serve the app
   */
  port: number;
  /**
   * How long sessions should last in seconds.
   */
  session_ttl: number;
  /**
   * 32 char string to be used for signing sessions
   */
  session_secret: string;
  /**
   * Name of the app. This will appear in the logs
   */
  app_name: string;
  /**
   * The auth user for the mail transport
   */
  mail_user: string;
  /**
   * The auth password for the mail transport
   */
  mail_pass: string;
  /**
  /**
   * Postgres host
   */
  postgres_host: string;
  /**
   * Postgres port
   */
  postgres_port: number;
  /**
   * Postgres Test DB Name
   */
  test_postgres_db: string;
  /**
   * Postgres DB name
   */
  postgres_db: string;
  /**
   * Postgres user
   */
  postgres_user: string;
  /**
   * Postgres password
   */
  postgres_password: string;
  /**
   * Postgres schema
   */
  postgres_schema: string;
  /**
   * Redis URL
   */
  redis_url: string;
  /**
   * Redis passord
   */
  redis_password: string;
  /*
   *  Access key
   */
  access_key: string;
  /*
   * Secret key
   */
  secret_access_key: string;
  /*
   * Region
   */
  region: string;
  /*
   * Bucket name
   */
  bucket_name: string;
}

export default class Environment {
  private envvars: EnvConfig;

  constructor(envConfig: EnvConfig) {
    this.envvars = envConfig;
  }

  env() {
    return this.envvars;
  }
}

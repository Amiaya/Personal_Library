import knex from "knex";
import path from "path";
import pg from "pg";
import Postgrator from "postgrator";

import { EnvConfig } from "@app/internal/env";
import { excludeProperties } from "@app/internal/postgres";
import { Logger } from "@risemaxi/octonet";

// parse numeric types as floats
pg.types.setTypeParser(pg.types.builtins.NUMERIC, parseFloat);

export async function createPostgres(logger: Logger, env: EnvConfig) {
  const pg = knex({
    client: "pg",
    connection: {
      host: env.postgres_host,
      port: env.postgres_port,
      user: env.postgres_user,
      password: env.postgres_password,
      database:
        env.node_env === "test" ? env.test_postgres_db : env.postgres_db,
      ssl:
        // env.is_production ? { rejectUnauthorized: false } :
        false,
      application_name: env.app_name
    },
    searchPath: [env.postgres_schema],
    postProcessResponse: (result, queryContext) => {
      return excludeProperties(result, queryContext);
    }
  });
  pg.on("error", err => logger.error(err));

  // Create postgrator instance
  const postgrator = new Postgrator({
    migrationPattern: path.join(process.cwd(), "db/migrations/*"),
    driver: "pg",
    database: env.node_env === "test" ? env.test_postgres_db : env.postgres_db,
    schemaTable: "schema_migrations",
    currentSchema: env.postgres_schema,
    execQuery: query => pg.raw(query)
  });

  await pg.raw(
    `
     create schema if not exists ${env.postgres_schema} authorization ${env.postgres_user};
     set search_path to public;
     create extension if not exists pgcrypto;
    `
  );

  await postgrator.migrate();

  return pg;
}

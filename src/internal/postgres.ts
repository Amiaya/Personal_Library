import "reflect-metadata";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import unset from "lodash/unset";

import INTERNAL_TYPES from "./types";

/**
 * Base row type for postgresql tables
 */
export interface Model {
  /**
   * ID of the row
   */
  id: string;
  /**
   * date the row was created
   */
  created_at: Date;
  /**
   * timestamp of last update
   */
  updated_at: Date;
}

/**
 * Enable soft delete on a model
 */
export interface Archivable {
  /**
   * timestamp when row was soft deleted, if it has been
   * soft deleted in the first place
   */
  deleted_at: Date;
}
export const ORDER_DIRECTIONS = <const>["asc", "desc"];
export type OrderDirection = (typeof ORDER_DIRECTIONS)[number];

export interface OrderQuery {
  order_by: string;
  order: OrderDirection;
}

export interface PaginatedQuery {
  limit: number;
  offset: number;
  nopaginate: boolean;
}

type RawPaginatedResults<T> = T & { item_count: string };

export interface PaginatedResult<T> {
  items: T[];
  item_count: number;
}

@injectable()
export class Repository<T> {
  @inject(INTERNAL_TYPES.KnexDB) protected knex: Knex;

  /**
   * creates a knex query object for a specified table
   * @param table table name
   * @param excluded fields which should be excluded from the query result to be returned
   * @returns
   */
  protected setup(table: string, ...excluded: string[]) {
    return () => this.knex<T>(table).queryContext({ excluded });
  }

  protected async paginated(
    db: Knex.QueryBuilder,
    limit: number,
    offset: number
  ): Promise<PaginatedResult<T>> {
    const raw: RawPaginatedResults<T>[] = await db
      .select(this.knex.raw("count(*) OVER() AS item_count"), "*")
      .limit(limit)
      .offset(offset);

    if (raw.length === 0) {
      return { item_count: 0, items: [] };
    }

    const total = parseInt(raw[0].item_count);
    raw.forEach((r) => {
      delete r["item_count"];
    });

    return { item_count: total, items: raw };
  }
}

const defaultToJSON = function () {
  return { ...this };
};

/**
 * Knex postProcessResponse hook for protecting properties from being exposed over
 * the web.
 * @param result result of query
 * @param context context provided when building the query
 * @returns the modified result
 */
export function excludeProperties(result?: Model | Model[], context?: any) {
  if (result && context?.excluded && context.excluded.length > 0) {
    const rows = Array.isArray(result) ? result : [result];

    rows.forEach((result) => {
      const superToJSON = result["toJSON"] || defaultToJSON.bind(result);
      result["toJSON"] = function () {
        const data = superToJSON();

        context.excluded.forEach((path: string) => {
          unset(data, path);
        });

        return data;
      };
    });
  }

  return result;
}

import { PaginatedResult, Repository } from "@app/internal/postgres";
import { History, HistoryDTO, HistoryQuery } from "./history.model";
import { isEmpty, omit } from "lodash";

export class HistoryRepository extends Repository<History> {
  private db = this.setup("histories");

  async record(dto: HistoryDTO): Promise<History> {
    const [history] = await this.db().insert(dto, "*");

    return history;
  }

  async list(
    query?: HistoryQuery
  ): Promise<History[] | PaginatedResult<History>> {
    let db = isEmpty(query)
      ? this.db()
      : this.db().where(
          omit(query, ["limit", "offset", "nopaginate", "order_by", "order"])
        );

    db = db.orderBy(query.order_by, query.order);

    if (query.nopaginate) {
      return await db;
    }

    return await this.paginated(db, query.limit, query.offset);
  }
}

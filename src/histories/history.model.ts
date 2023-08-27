import { Model, OrderQuery, PaginatedQuery } from "@app/internal/postgres";

export const FILE_STATUSES = <const>["download", "upload"];
export type FileStatus = (typeof FILE_STATUSES)[number];

export interface History extends Model {
  /**
   * user id
   */
  user_id: string;
  /**
   * file id
   */
  file_id: string;
  /**
   * file status
   */
  file_status: FileStatus;
}

export type HistoryDTO = Omit<History, keyof Model>;

export interface HistoryQuery extends History, PaginatedQuery, OrderQuery {}

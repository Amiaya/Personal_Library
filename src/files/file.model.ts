import { Model, OrderQuery, PaginatedQuery } from "@app/internal/postgres";

export interface File extends Model {
  /**
   * file name
   */
  file_name: string;
  /**
   * file uploaded
   */
  file: string;
  /**
   * file size
   */
  size: number;
  /**
   * description of the file
   */
  description?: string;
  /**
   * owner of file
   */
  owner_id: string;
}

export type FileDTO = Omit<File, keyof Model>;

export interface FileQuery extends PaginatedQuery, OrderQuery {
  owner_id?: string;
}

export interface UnsafeFile {
  ids: string[];
}

export interface DownloadLink {
  link: string
}
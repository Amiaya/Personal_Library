import faker from "faker";
import { File, FileDTO } from "@app/files";
import { Knex } from "knex";

export function newFileDTO(extra: Partial<FileDTO> = {}): Partial<FileDTO> {
  return {
    file_name: faker.name.findName(),
    description: faker.lorem.sentences(),
    ...extra,
  };
}

export async function createFile(pg: Knex, dto?: Partial<File>) {
  const [file] = await pg<File>("files").insert(
    {
      ...newFileDTO(),
      ...dto,
    },
    "*"
  );
  return file;
}
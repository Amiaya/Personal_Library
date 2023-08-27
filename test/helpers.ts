import { StatusCodes } from "http-status-codes";
import { Test } from "supertest";
import { promisify } from "util";

export const sleep = promisify(setTimeout);

export async function getSuccess<T>(t: Test) {
  const { body } = await t.expect(StatusCodes.OK);
  return body as T;
}

export async function getError(code: number, t: Test): Promise<string> {
  const { body } = await t.expect(code);
  return body.message;
}

export async function repeat(
  n: number,
  fn: (i?: number) => Promise<any>
): Promise<any[]> {
  const jobs = Array.from({ length: n }).map((_x, i) => fn(i));
  return Promise.all(jobs);
}

export function multiply<T>(n: number, fn: () => T): T[] {
  const results: T[] = [];

  for (let i = 0; i < n; i++) {
    results.push(fn());
  }

  return results;
}

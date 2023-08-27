import "reflect-metadata";
import "@app/http/controllers/files/file.controller";

import chai, { expect } from "chai";
import Environment, { EnvConfig, envSchema, setupEnv } from "@app/internal/env";
import chaiAsPromised from "chai-as-promised";
import { Application } from "express";
import { Container } from "inversify";
import Redis from "ioredis";
import fs from "fs";
import { Knex } from "knex";
import { createPostgres } from "@app/config/postgres";
import { Logger, RedisStore, defaultSerializers } from "@risemaxi/octonet";
import { createRedis } from "@app/config/redis";
import INTERNAL_TYPES from "@app/internal/types";
import APP_TYPES from "@app/config/types";
import { AuthMiddleware } from "@app/http/middlewares/auth";
import { UserRepository, UserService } from "@app/users";
import { App } from "../../src/app";
import { createUser, getAuthToken, signupUser } from "../helpers/auth";
import { getError, getSuccess, repeat } from "../helpers";
import request from "supertest";
import { DownloadLink, File, FileRepository } from "@app/files";
import { createFile, newFileDTO } from "../helpers/file";
import faker from "faker";
import { PaginatedResult } from "@app/internal/postgres";
import { StatusCodes } from "http-status-codes";
import { HistoryRepository } from "@app/histories";
import { AccessMiddleware } from "@app/http/middlewares/access";
import { GenericMessage } from "@app/internal/http";

chai.use(chaiAsPromised);

const baseURL = "/api/v1";

let container: Container;
let app: Application;
let env: EnvConfig;
let pg: Knex;
let redis: Redis;

beforeAll(async () => {
  const envvars = setupEnv(envSchema);
  const environment = new Environment(envvars);
  env = environment.env();
  const logger = new Logger({
    name: env.app_name,
    serializers: defaultSerializers(),
  });
  container = new Container();

  pg = await createPostgres(logger, env);

  container.bind<Knex>(INTERNAL_TYPES.KnexDB).toConstantValue(pg);
  container.bind<Logger>(INTERNAL_TYPES.Logger).toConstantValue(logger);
  container.bind<EnvConfig>(INTERNAL_TYPES.Env).toConstantValue(env);

  redis = await createRedis(logger, environment.env());
  container.bind<Redis>(INTERNAL_TYPES.Redis).toConstantValue(redis);

  const redisStore = new RedisStore(env.session_secret, redis);
  container
    .bind<RedisStore>(INTERNAL_TYPES.RedisStore)
    .toConstantValue(redisStore);
  container.bind<AuthMiddleware>(APP_TYPES.AuthMiddleware).to(AuthMiddleware);
  container.bind<UserRepository>(APP_TYPES.UserRepository).to(UserRepository);
  container.bind<UserService>(APP_TYPES.UserService).to(UserService);
  container
    .bind<HistoryRepository>(APP_TYPES.HistoryRepository)
    .to(HistoryRepository);
  container
    .bind<AccessMiddleware>(APP_TYPES.AccessMiddleware)
    .to(AccessMiddleware);

  container.bind<FileRepository>(APP_TYPES.FileRepository).to(FileRepository);

  app = new App(container, logger, env).server.build();
});

afterAll(async () => {
  await pg("files").del();
  await redis.quit();
});

beforeEach(async () => {
  await pg("files").del();
});

describe("FileController#uploadFile", () => {
  it("should successfully upload file", async () => {
    const user = await signupUser(container);
    const dto = newFileDTO();
    const token = await getAuthToken(container, "10s", user);
    const response = await getSuccess<File>(
      request(app)
        .post(`${baseURL}/files`)
        .set({
          Authorization: token,
        })
        .query({ folder: "boss/private" })
        .field("file_name", dto.file_name)
        .field("description", dto.description)
        .attach(
          "file",
          fs.readFileSync(`test/files/test-picture.jpeg`),
          "test/files/test-picture.jpeg"
        )
    );
    expect(response.file_name).to.eq(dto.file_name);
    expect(response.description).to.eq(dto.description);
    expect(response.owner_id).to.eq(user.id);
    expect(response).to.haveOwnProperty("file");
  });
});

describe("FileController#list", () => {
  it("should successfully return a list of object", async () => {
    const user = await signupUser(container);

    const files: File[] = await repeat(
      3,
      async () =>
        await createFile(pg, {
          file: faker.image.imageUrl(),
          owner_id: user.id,
          size: faker.datatype.number({ min: 1000, max: 10000 }),
          file_name: faker.name.findName(),
        })
    );

    const token = await getAuthToken(container, "10s", user);
    const responses = await getSuccess<PaginatedResult<File>>(
      request(app).get(`${baseURL}/files`).set({
        Authorization: token,
      })
    );
    expect(responses.item_count).to.eq(3);
    responses.items.forEach((response) => {
      expect(response.owner_id).to.eq(files[0].owner_id);
    });
  });
});

describe("FileController#download", () => {
  it("should successfully download the file", async () => {
    const user = await signupUser(container);

    const files: File[] = await repeat(
      3,
      async () =>
        await createFile(pg, {
          file: faker.image.imageUrl(),
          owner_id: user.id,
          size: faker.datatype.number({ min: 1000, max: 10000 }),
          file_name: faker.name.findName(),
        })
    );

    const token = await getAuthToken(container, "10s", user);
    const response = await getSuccess<DownloadLink>(
      request(app).get(`${baseURL}/files/download/${files[0].id}`).set({
        Authorization: token,
      })
    );
    expect(response).to.haveOwnProperty("link");
  });

  it("should fail if file is not found", async () => {
    const user = await signupUser(container);
    const fileId = faker.datatype.uuid();
    const token = await getAuthToken(container, "10s", user);
    const errorMessage = await getError(
      StatusCodes.NOT_FOUND,
      request(app).get(`${baseURL}/files/download/${fileId}`).set({
        Authorization: token,
      })
    );
    expect(errorMessage).to.eq("File not found");
  });
});

describe("FileController#unsafe", () => {
  it("should successfully delete files that are marked as unsafe", async () => {
    const user = await createUser(pg, { account_type: "admin" });

    const files: File[] = await repeat(
      3,
      async () =>
        await createFile(pg, {
          file: faker.image.imageUrl(),
          owner_id: user.id,
          size: faker.datatype.number({ min: 1000, max: 10000 }),
          file_name: faker.name.findName(),
        })
    );

    const token = await getAuthToken(container, "10s", user);
    const response = await getSuccess<GenericMessage>(
      request(app)
        .patch(`${baseURL}/files/unsafe`)
        .set({
          Authorization: token,
        })
        .send({ ids: [files[0].id, files[1].id] })
    );

    expect(response.message).to.eq("Files have been successfully removed");
  });
});

import "reflect-metadata";
import "@app/http/controllers/app/app.controller";

import chai, { expect } from "chai";
import { getSuccess } from "../helpers";

import { App } from "../../src/app";
import { Application } from "express";
import { Container } from "inversify";
import chaiAsPromised from "chai-as-promised";
import request from "supertest";
import Environment, { envSchema, setupEnv } from "@app/internal/env";
import INTERNAL_TYPES from "@app/internal/types";
import { defaultSerializers, Logger } from "@risemaxi/octonet";

chai.use(chaiAsPromised);

const baseURL = "/api/v1/app";

let container: Container;
let app: Application;

beforeAll(async () => {
  const envvars = setupEnv(envSchema);
  const environment = new Environment(envvars);
  const env = environment.env();
  const logger = new Logger({
    name: env.app_name,
    serializers: defaultSerializers()
  });

  // config setup
  container = new Container();
  container.bind<Logger>(INTERNAL_TYPES.Logger).toConstantValue(logger);

  app = new App(container, logger, env).server.build();
});

describe("AppController#ping", () => {
  it("should ping successfully", async () => {
    const response = await getSuccess<{ message: string }>(
      request(app).get(`${baseURL}/ping`)
    );

    expect(response.message).to.eql("Pong!");
  });
});

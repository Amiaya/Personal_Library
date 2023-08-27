import cors from "cors";
import express, { Application } from "express";
import helmet from "helmet";
import Status from "http-status-codes";
import { Container } from "inversify";
import { InversifyExpressServer } from "inversify-express-utils";
import responseTime from "response-time";

import { captureBody, errors, logRequest } from "@app/http/middlewares";
import { Logger } from "@risemaxi/octonet";

import { EnvConfig } from "./internal/env";

export class App {
  readonly server: InversifyExpressServer;
  constructor(
    container: Container,
    logger: Logger,
    env: EnvConfig,
    healthCheck = () => Promise.resolve()
  ) {
    this.server = new InversifyExpressServer(container, null, {
      rootPath: env.api_version
    });

    // setup server-level middlewares
    this.server.setConfig((app: Application) => {
      app.disable("x-powered-by");

      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));

      // enable CORS for browser clients
      app.use(cors());
      app.options("*", cors());

      app.use(helmet());
      app.use(responseTime());

      app.use(logRequest(logger));
      app.use(captureBody);
    });

    /**
     * Register handlers after all middlewares and controller routes have been mounted
     */
    this.server.setErrorConfig((app: Application) => {
      app.get("/", async (_req, res) => {
        try {
          await healthCheck();
        } catch (err) {
          return res.status(Status.INTERNAL_SERVER_ERROR).send(err.message);
        }

        return res.status(200).send("Pong!");
      });

      app.get(env.api_version, async (_req, res) => {
        try {
          await healthCheck();
        } catch (err) {
          return res.status(Status.INTERNAL_SERVER_ERROR).send(err.message);
        }

        return res.status(200).send("Ping<>Pong");
      });

      app.use((req, res, _next) => {
        return res.status(404).send(`Cannot ${req.method} ${req.path}`);
      });

      app.use(errors(logger));
    });
  }
}

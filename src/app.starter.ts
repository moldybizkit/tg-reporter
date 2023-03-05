import { ConfigLoader } from "./utils/config.loader";
import { getLogger, RequestLoggerController } from "./utils/logger";
import * as bodyParser from "body-parser";
import rTracer from "cls-rtracer";
import compression from "compression";
import errorHandler from "errorhandler";
import express from "express";
import { Logger } from "winston";

import setupApp from "./app";

export const serviceName = "tgReporter";

function createDefault(
  logger: Logger,
  _cfg: any
): express.Express {
  const requestLoggerController = new RequestLoggerController(logger);

  // Create Express server
  const app = express();

  // Express configuration
  app.use(compression());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(errorHandler());
  app.use(rTracer.expressMiddleware());

  // Log controller. Logs everything except `/status` resource.
  app.all(
    /^(?!\/status$).*/,
    (req: express.Request, res: express.Response, next: express.NextFunction) =>
      requestLoggerController.logRequest(req, res, next)
  );

  app.get("/status", (req: express.Request, res: express.Response) => {
    logger.silly({ method: "getStatus" });
    res.status(200).send({ status: "ok" });
  });

  return app;
}

export async function buildApp(
  rootLogger: Logger,
  confPath: string
) {
  rootLogger.info(`Loading config: ${confPath}`);
  const loader = new ConfigLoader(rootLogger);
  const cfg = loader.loadFromFile(confPath);
  const serviceCfg = cfg[serviceName];
  rootLogger.info(`Config is loaded:`, serviceCfg);
  const logLevel = serviceCfg?.logLevel || "info";
  const port = serviceCfg?.port || 3000;
  const gracefulShutdown = serviceCfg?.gracefulShutdown || 5;

  const logger = getLogger(logLevel, serviceName);

  // App with aux services
  const app = createDefault(logger, cfg);

  // Primary services
  await setupApp(app, logger, cfg);

  return new Promise((resolve) => {
    resolve({app, port, gracefulShutdown});
  });
}

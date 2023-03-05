import { Server } from "http";

import { ConfigLoader } from "./utils/config.loader";
import { getLogger } from "./utils/logger";
import { Logger } from "winston";

import { buildApp, serviceName } from "./app.starter";

const logger: Logger = getLogger("info", serviceName);

function info(message: string) {
  logger.info({ method: "server", message });
}

function logError(message: string, error: string) {
  logger.error({ method: "server", message, error });
}

info("Starting the app");
const confPath = ConfigLoader.getConfigPath(process.argv);

let server: Server;
let timeout: number;

function terminate() {
  info("Process terminated");
  process.exit();
}

async function shutdownExpressServer(): Promise<void> {
  info("HTTP server shuts down");
  return new Promise((resolve) => {
    let watchDog = true;
    server.close(() => {
      info("HTTP shut down gracefully");
      watchDog = false;
      resolve();
    });
    setTimeout(() => {
      if (watchDog) {
        info("HTTP graceful shut down failed, terminating.");
        resolve();
      }
    }, timeout * 1000);
  });
}

function runApp(application) {
  const { app, port, gracefulShutdown: gs } = application;
  timeout = gs;
  server = app.listen(port, () => {
    info(`HTTP server is running at ${port}`);
  });
}

async function shutdown() {
  await shutdownExpressServer();
  terminate();
}

async function reboot(): Promise<void> {
  const rebootInternal = async (
    resolve: (value: void | PromiseLike<void>) => void
  ) => {
    info("Application is restarting");
    try {
      const app = await buildApp(logger, confPath);
      await shutdownExpressServer();
      runApp(app);
    } catch (e) {
      const message =
        "Configuration error! Reboot request is rejected. " +
        "Service cannot be restarted with specified configuration.";
      logError(message, `${e}`);
    }
    resolve();
  };
  return new Promise((resolve) => rebootInternal(resolve));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("SIGHUP", reboot);

buildApp(logger, confPath)
  .then(runApp)
  .catch((e) => {
    logError(
      "Application is failed to start with error. Shutting down.",
      `${e}`
    );
    process.exit(1);
  });

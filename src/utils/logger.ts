import rTracer from "cls-rtracer";
import winston, { Logger } from "winston";
import { NextFunction, Request, Response } from "express";

const rTracerFormat = winston.format.printf((info) => {
  const rid = rTracer.id() as string;
  info.traceId = rid ? rid : "00000000-0000-0000-0000-000000000000";
  return JSON.stringify(info);
});

export function getLogger(level: string, serviceName: string): winston.Logger {
  const minLevel = level.toLowerCase();
  return winston.createLogger({
    level: minLevel,
    format: winston.format.combine(winston.format.timestamp(), rTracerFormat),
    defaultMeta: { service: serviceName },
    transports: [new winston.transports.Console()],
  });
}

export class RequestLoggerController {
  logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  logRequest(req: Request, res: Response, next: NextFunction): void {
    const logEntity = {
      method: "intercept",
      httpMethod: req.method,
      url: req.originalUrl,
    };
    this.logger.debug({ ...logEntity, message: "request" });
    const start = new Date().getTime();
    res.on("finish", () => {
      const duration = new Date().getTime() - start;
      this.logger.debug({
        ...logEntity,
        message: "response",
        code: res.statusCode,
        duration,
      });
    });
    next();
  }
}
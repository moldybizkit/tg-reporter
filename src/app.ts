import express, { Request, Response } from "express";
import { MongoClient } from "mongodb";
import { schedule } from "node-cron";
import TelegramBot from "node-telegram-bot-api";
import { Logger } from "winston";
import { TelegramController } from "./controllers/telegram.controller";
import { VbtModel } from "./models/vbt.model";
import { IndService } from "./service/ind/ind.service";
import { TelegramService } from "./service/telegram/telegram.service";
import { VbtService } from "./service/vbt/vbt.service";

export default async function setupApp(
  app: express.Express,
  logger: Logger,
  cfg: any
): Promise<void> {
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 2000,
  };

  const mongoClient = await new MongoClient(cfg.mongoDbUrl, options).connect();

  const vbtModel = new VbtModel(mongoClient);
  const vbtService = new VbtService(vbtModel);

  const indService = new IndService();

  const bot = new TelegramBot(cfg.tgToken);
  bot.setWebHook(cfg.appUrl);

  const telegramService = new TelegramService(
    bot,
    vbtService,
    logger,
    indService
  );
  const telegramController = new TelegramController(telegramService);

  schedule("*/1 * * * *", async () => {
    console.log("CRON JOB: IND started");
    const report = await indService.getLatestReport();
    if (report) {
      await telegramService.sendToUser(report);
    }
    console.log("CRON JOB: IND finished.");
  });

  schedule("*/30 * * * *", async () => {
    const currentTime = new Date();
    if (currentTime.getHours() > 8 && currentTime.getHours() < 21) {
      console.log("CRON JOB: VBT started");
      const newHouses = await vbtService.iterate();

      if (newHouses.length > 0) {
        const report = vbtService.buildOnlyNewTelegramReport(newHouses);
        await telegramService.sendToUser(report);
      }
      console.log("CRON JOB: VBT finished.");
    }
  });

  app.post("/webhook", async (req: Request, res: Response) => {
    await telegramController.webhook(req, res);
  });

  return Promise.resolve();
}

import { Request, Response } from "express";
import { Update } from "node-telegram-bot-api";
import { TelegramService } from "../service/telegram/telegram.service";

export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {
  }

  public async webhook(req: Request, res: Response) {
    const update = req.body as Update;

    await this.telegramService.replyToUser(update);

    res.status(200).send();
  }
}
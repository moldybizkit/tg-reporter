import TelegramBot, { Update } from "node-telegram-bot-api";
import { Logger } from "winston";
import { IndService } from "../ind/ind.service";
import { VbtService } from "../vbt/vbt.service";

const myID = "1160212745";

export class TelegramService {
  constructor(
    protected readonly bot: TelegramBot,
    protected readonly vbtService: VbtService,
    protected readonly logger: Logger,
    protected readonly indService: IndService,
  ) {}

  async replyToUser(update: Update) {
    if (update.message?.from?.username !== "moldybizkit") {
      await this.bot.sendMessage(
        myID,
        "Someone tried to access your bot: " + JSON.stringify(update)
      );
      this.logger.debug({
        message: "Incorrect message to webhook: ",
        update,
      });
    }

    switch (update.message?.text) {
      case "/vbt": {
        const response = await this.vbtService.buildFullTelegramReport();

        await this.bot.sendMessage(myID, response);
        return;
      }
      case "/ind": {
        const report = await this.indService.getLatestReport();

        await this.bot.sendMessage(myID, report ? report : "No updates");
        return;
      }
      default: {
        if (update.message) {
          await this.bot.sendMessage(
            update.message.chat.id,
            "Invalid command!!!"
          );
        } else {
          this.logger.debug({
            message: "Incorrect message to webhook: ",
            update,
          });
        }
      }
    }
  }

  async sendToUser(message: string) {
    try {
      await this.bot.sendMessage(myID, message);
    } catch (e) {
      this.logger.error({
        message: "Something went wrong on sending message: ",
        error: e,
      });
    }
  }
}

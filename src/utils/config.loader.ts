import fs from "fs";

import { Logger } from "winston";

export class ConfigLoader {
  logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  loadFromFile(path: string) {
    try {
      const config = fs.readFileSync(path, "utf8");
      return JSON.parse(config);
    } catch (e) {
      this.logger.error({
        method: "ConfigLoader.loadFromFile",
        message: "Unknown error occurred while config loading",
        error: `${e}`,
      });
      throw e;
    }
  }

  public static getConfigPath(argv: string[]): string {
    const args = argv.slice(2);
    if (args.length !== 1) {
      throw new Error(
        "Config file path is not present. Usage: $ node server.js [path to config]"
      );
    }
    return args[0];
  }
}
import APP_TYPES from "@app/config/types";
import { inject, injectable } from "inversify";
import { SendMailOptions } from "nodemailer";

import { EmailClient } from "./email.client";

@injectable()
export class EmailService {
  @inject(APP_TYPES.EmailClient) private client: EmailClient;

  public async send(options: SendMailOptions): Promise<void> {
    await this.client.send(options);
  }
}

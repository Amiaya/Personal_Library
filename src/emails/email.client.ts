import { EnvConfig } from "@app/internal/env";
import { injectable } from "inversify";
import nodemailer, { SendMailOptions, Transporter } from "nodemailer";

@injectable()
export class EmailClient {
  private client: Transporter;

  constructor(env: EnvConfig) {
    this.client = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.mail_user,
        pass: env.mail_pass,
      },
    });
  }

  async send(options: SendMailOptions): Promise<void> {
    await this.client.sendMail(options);
  }
}

import APP_TYPES from "@app/config/types";
import { EmailService } from "@app/emails";
import { inject, injectable } from "inversify";
import { ForgotPasswordDTO } from "./user.model";

@injectable()
export class UserEmails {
  @inject(APP_TYPES.EmailService) private email: EmailService;

  async sendForgotPasswordEmail(message: string, user: ForgotPasswordDTO) {
    return await this.email.send({
      from: "amiayajason@gmail.com",
      subject: "Reset your password",
      to: user.email,
      text: message,
    });
  }
}

import { createStubInstance } from "sinon";
import { ForgotPasswordDTO, UserEmails } from "@app/users";

export const USER_EMAILS_STUB = createStubInstance(UserEmails);

export function mockSendForgotPassword(
  message: string,
  user: ForgotPasswordDTO
) {
  return USER_EMAILS_STUB.sendForgotPasswordEmail
    .withArgs(message, user)
    .resolves();
}

export interface Email {
  /**
   * Sender address
   */
  from: string;
  /**
   * Recipient address
   */
  to: string | string[];
  /**
   * Subject of email
   */
  subject: string;
  /**
   * Text content
   */
  text: string;
}

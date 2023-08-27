import { Model } from "@app/internal/postgres";

export const ACCOUNT_TYPES = <const>["admin", "user"];
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export interface User extends Model {
  /**
   * User's first name
   */
  first_name: string;
  /**
   * User's last name
   */
  last_name: string;
  /**
   * User's email address
   */
  email: string;
  /**
   * User's password hash
   */
  password_hash: Buffer;
  /**
   * Account type
   */
  account_type?: AccountType;
}

export type UserDTO = Omit<User, keyof Model>;

export type UserToken = { user: User; token?: string; token_ttl?: number };

export interface SignupDTO {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
}

export interface AuthTokenDTO {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  account_type: string;
}

export interface TokenDTO {
  timestamp: number;
  token: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface ForgotPasswordQuery {
  email: string;
}

export interface ForgotPasswordDTO {
  first_name: string;
  email: string;
}

export interface ForgotPasswordVerify extends ForgotPasswordQuery {
  password: string;
}

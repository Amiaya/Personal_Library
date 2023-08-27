import { Request, Response } from "express";
import { Controller, GenericMessage } from "@app/internal/http";
import {
  controller,
  httpGet,
  httpPost,
  queryParam,
  request,
  requestBody,
  response,
} from "inversify-express-utils";
import {
  DuplicateUser,
  ForgotPasswordQuery,
  ForgotPasswordVerify,
  LoginDTO,
  SignupDTO,
  User,
  UserEmails,
  UserRepository,
  UserService,
  UserToken,
} from "@app/users";
import APP_TYPES from "@app/config/types";
import { inject } from "inversify";
import { autoValidate } from "@app/internal/validator";
import {
  isForgotPasswordQuery,
  isForgotPasswordVerify,
  isLogin,
  isSignup,
} from "./auth.validator";
import { EnvConfig } from "@app/internal/env";
import INTERNAL_TYPES from "@app/internal/types";
import { ApplicationError } from "@app/internal/errors";
import { StatusCodes } from "http-status-codes";
import Redis from "ioredis";

type ControllerResponse = User | UserToken | GenericMessage;

@controller("/auth")
export class AuthController extends Controller<ControllerResponse> {
  @inject(APP_TYPES.UserRepository) private userRepo: UserRepository;
  @inject(APP_TYPES.UserService) private userService: UserService;
  @inject(INTERNAL_TYPES.Env) private env: EnvConfig;
  @inject(APP_TYPES.UserEmails) private emails: UserEmails;
  @inject(INTERNAL_TYPES.Redis) private redis: Redis;

  @httpPost("/signup", autoValidate(isSignup))
  async signup(
    @request() req: Request,
    @response() res: Response,
    @requestBody() dto: SignupDTO
  ) {
    try {
      const password_hash = await this.userService.getHash(dto.password);
      const user = await this.userRepo.create({
        email: dto.email,
        first_name: dto.first_name,
        last_name: dto.last_name,
        password_hash: Buffer.from(password_hash),
      });

      const token = await this.userService.getAuthToken({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        account_type: user.account_type,
      });

      this.send(req, res, { user, token, token_ttl: this.env.session_ttl });
    } catch (error) {
      if (error instanceof DuplicateUser) {
        throw new ApplicationError(StatusCodes.CONFLICT, error.message);
      }

      throw error;
    }
  }

  @httpPost("/login", autoValidate(isLogin))
  async login(
    @request() req: Request,
    @response() res: Response,
    @requestBody() dto: LoginDTO
  ) {
    const user = await this.userRepo.getByEmail(dto.email);
    if (!user) {
      throw new ApplicationError(
        StatusCodes.UNAUTHORIZED,
        "Invalid email / password"
      );
    }

    const isMatch = await this.userService.validatePassword(
      dto.password,
      user.password_hash.toString()
    );

    if (!isMatch) {
      throw new ApplicationError(
        StatusCodes.UNAUTHORIZED,
        "Invalid email / password"
      );
    }

    const token = await this.userService.getAuthToken({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      account_type: user.account_type,
    });

    this.send(req, res, {
      user,
      token,
      token_ttl: this.env.session_ttl,
    });
  }

  @httpGet("/forgot-password", autoValidate(isForgotPasswordQuery, "query"))
  async requestForgotPassword(
    @request() req: Request,
    @response() res: Response,
    @queryParam() query: ForgotPasswordQuery
  ) {
    const user = await this.userRepo.getByEmail(query.email);
    if (!user) {
      return this.send(req, res, {
        message:
          "You will receive an email shortly if you have an account with us",
      });
    }
    const otpKey = this.userService.getTokenHash(
      `forgot-password.${query.email}`
    );
    const data = {
      id: user.id,
      first_name: user.first_name,
    };

    await this.redis.set(
      otpKey,
      JSON.stringify(data),
      "EX",
      this.env.session_ttl
    );

    const message = this.userService.getEmailMessage(req.protocol);

    await this.emails.sendForgotPasswordEmail(message, {
      first_name: user.first_name,
      email: user.email,
    });

    this.send(req, res, {
      message:
        "You will receive an email shortly if you have an account with us",
    });
  }

  @httpPost("/reset-password", autoValidate(isForgotPasswordVerify, "body"))
  async resetPassword(
    @request() req: Request,
    @response() res: Response,
    @requestBody() dto: ForgotPasswordVerify
  ) {
    const user = await this.userRepo.getByEmail(dto.email);

    if (!user) {
      throw new ApplicationError(
        StatusCodes.BAD_REQUEST,
        "Invalid user details"
      );
    }
    const otpKey = this.userService.getTokenHash(
      `forgot-password.${dto.email}`
    );

    const result = await this.redis.get(otpKey);
    if (!result) {
      throw new ApplicationError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        "Invalid or expired OTP sent"
      );
    }

    const passwordHash = await this.userService.getHash(dto.password);
    await this.userRepo.updatePassword(user.id, passwordHash);

    const token = await this.userService.getAuthToken({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      account_type: user.account_type,
    });

    this.send(req, res, {
      user,
      token,
      token_ttl: this.env.session_ttl,
    });
  }

  @httpPost("/logout", APP_TYPES.AuthMiddleware)
  async logout(@request() req: Request, @response() res: Response) {
    const user = await this.userRepo.getByEmail(req.session.email);
    if (!user) {
      throw new ApplicationError(
        StatusCodes.UNAUTHORIZED,
        "Could not authenticate"
      );
    }

    await this.userService.logout(user.id);

    this.send(req, res, { message: "OK" });
  }
}

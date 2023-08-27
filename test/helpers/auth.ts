import faker from "faker";
import { Container } from "inversify";
import { Knex } from "knex";

import TYPES from "@app/config/types";
import INTERNAL_TYPES from "@app/internal/types";
import {
  AuthTokenDTO,
  SignupDTO,
  User,
  UserDTO,
  UserRepository,
  UserService,
} from "@app/users";
import { RedisStore } from "@risemaxi/octonet";
import { Redis } from "ioredis";
import { EnvConfig } from "@app/internal/env";

export async function signupUser(
  container: Container,
  dto?: Partial<SignupDTO>
) {
  const userDTO = newSignupDTO(dto);
  const userRepo = container.get<UserRepository>(TYPES.UserRepository);
  const userService = container.get<UserService>(TYPES.UserService);

  const hash = await userService.getHash(userDTO.password);
  return await userRepo.create({
    email: userDTO.email,
    password_hash: Buffer.from(hash),
    first_name: userDTO.first_name,
    last_name: userDTO.last_name,
  });
}

export async function createUser(pg: Knex, dto?: Partial<UserDTO>) {
  const [user] = await pg<User>("users").insert(
    {
      ...newUserDTO(),
      ...dto,
    },
    "*"
  );

  return user;
}

export function newUserDTO(extra: Partial<UserDTO> = {}): UserDTO {
  return {
    email: faker.internet.email().toLowerCase(),
    first_name: faker.name.firstName(),
    last_name: faker.name.lastName(),
    password_hash: Buffer.from(faker.random.alphaNumeric(10)),
    ...extra,
  };
}

export function newSignupDTO(extra: Partial<SignupDTO> = {}): SignupDTO {
  return {
    email: faker.internet.email().toLowerCase(),
    first_name: faker.name.firstName(),
    last_name: faker.name.lastName(),
    password: faker.random.alphaNumeric(10),
    ...extra,
  };
}

export async function getAuthToken(
  container: Container,
  ttl: string,
  data: Partial<AuthTokenDTO>
) {
  const redisStore = container.get<RedisStore>(INTERNAL_TYPES.RedisStore);
  const token = await redisStore.commision(data.id, data, ttl);
  return `Bearer ${token}`;
}

export async function storeOtpKey(
  container: Container,
  redis: Redis,
  env: EnvConfig,
  data: User
) {
  const userService = container.get<UserService>(TYPES.UserService);
  const otpKey = userService.getTokenHash(`forgot-password.${data.email}`);
  await redis.set(
    otpKey,
    JSON.stringify({
      id: data.id,
      first_name: data.first_name,
    }),
    "EX",
    env.session_ttl
  );

  return;
}

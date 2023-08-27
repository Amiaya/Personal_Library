import joi from "joi";

const isTrimmedString = joi.string().trim();
const isEmail = joi.string().lowercase().trim().email();
const isPassword = isTrimmedString.min(8);

export const isSignup = joi.object({
  email: isEmail.required(),
  first_name: isTrimmedString.required(),
  last_name: isTrimmedString.required(),
  password: isPassword.required(),
});

export const isLogin = joi.object({
  email: isEmail.required(),
  password: isTrimmedString.required(),
});

export const isForgotPasswordQuery = joi.object({
  email: isEmail.required(),
});

export const isForgotPasswordVerify = joi.object({
  email: isEmail.required(),
  password: isPassword.required(),
});

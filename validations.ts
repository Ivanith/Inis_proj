import { body } from "express-validator";

export const loginValidation = [
  body("email", "email format error").isEmail(),
  body("password", "password must contain at least 5 symbols").isLength({
    min: 5,
  }),
];

export const registerValidation = [
  body("email", "email format error").isEmail(),
  body("password", "password must contain at least 5 symbols").isLength({
    min: 5,
  }),
  body("userName", "enter name").isLength({ min: 5 }),
];

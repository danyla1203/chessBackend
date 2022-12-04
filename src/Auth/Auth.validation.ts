import Joi = require('joi');

export const loginSchema = Joi.object({
  email: Joi.string().min(2).max(30).required(),
  password: Joi.string().min(2).max(20).required(),
  deviceId: Joi.string().min(2).required(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().min(2),
});
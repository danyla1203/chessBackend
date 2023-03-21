import Joi = require('joi');

export const loginSchema = Joi.object({
  email: Joi.string().min(2).max(30).required(),
  password: Joi.string().min(2).max(20).required(),
  deviceId: Joi.string().min(2).required(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().min(2).required(),
});

export const verifyEmailSchema = Joi.object({
  email: Joi.string().email().required()
});

export const verifyEmailCodeSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().min(2).required(),
});

export const googleOauthSchema = Joi.object({
  code: Joi.string().min(5).required()
});
import Joi = require('joi');

export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(30).required(),
  email: Joi.string().min(2).max(30).required(),
  password: Joi.string().min(2).max(20).required(),
  deviceId: Joi.string().min(4).required()
});
import { BaseError } from '.';
import { ErrorTypes } from './types';

export class BadRequestError extends BaseError {
  type = ErrorTypes.BAD_REQUEST;
  statusCode = '400';
  constructor(message: string) {
    super(message);
  }
}
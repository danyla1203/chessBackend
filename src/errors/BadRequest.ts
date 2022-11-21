import { BaseError } from '.';
import { ErrorTypes } from './types';

export class BadRequestError extends BaseError {
  type = ErrorTypes.BAD_REQUEST;
  constructor(message: string) {
    super(message);
  }
}
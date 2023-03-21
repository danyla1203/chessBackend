import { BaseError } from '.';
import { ErrorTypes } from './types';

export class ConflictError extends BaseError {
  type = ErrorTypes.CONFLICT;
  statusCode = '409';
  constructor(message: string) {
    super(message);
  }
}

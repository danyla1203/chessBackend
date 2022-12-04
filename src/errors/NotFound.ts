import { BaseError } from '.';

export class NotFound extends BaseError {
  statusCode = 404;
}
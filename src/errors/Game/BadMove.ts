import { BaseError } from '..';
import { GameErrors } from './types';

export class BadMoveError extends BaseError {
  type = GameErrors.BAD_MOVE;
  statusCode = 409;
}
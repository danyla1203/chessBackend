import { BaseError } from '..';
import { GameErrors } from './types';

export class GameNotFound extends BaseError {
  type = GameErrors.GAME_NOT_FOUND;
  statusCode = '404';
  message = 'Game not found';
}
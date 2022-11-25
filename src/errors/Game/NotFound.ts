import { BaseError } from '..';
import { GameErrors } from './types';

export class GameNotFound extends BaseError {
  type = GameErrors.GAME_NOT_FOUND;
  message = 'Game not found';
}
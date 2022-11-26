import { BaseError } from '..';
import { GameErrors } from './types';

export class InactiveGameError extends BaseError {
  type = GameErrors.GAME_IS_INACTIVE;
  message = 'Game is inative';
}
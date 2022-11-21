import { GameErrors } from './types';

export class InactiveGameError {
  type = GameErrors.GAME_IS_INACTIVE;
  message = 'Game is inative';
}
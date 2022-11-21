import { GameErrors } from './types';

export class GameNotFound {
  type = GameErrors.GAME_NOT_FOUND;
  message = 'Game not found';
}
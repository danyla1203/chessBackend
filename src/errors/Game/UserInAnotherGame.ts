import { BaseError } from '..';
import { GameErrors } from './types';

export class UserInAnotherGame extends BaseError {
  type = GameErrors.USER_ALREADY_IN_GAME;
  messager = 'User in another game';
}
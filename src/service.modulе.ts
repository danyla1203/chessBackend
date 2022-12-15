import { AuthService } from './Auth/AuthService';
import { GameService } from './GameAPI/GameService';
import { UserService } from './User/UserService';

export const authService = new AuthService();
export const userService = new UserService();
export const gameService = new GameService();

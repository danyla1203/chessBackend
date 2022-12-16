import { AuthService } from '../Auth/AuthService';
import { Request } from '../lib/ExtendContext';
import { get } from '../lib/httpMethodDecorators';
import { GameService } from './GameService';

export class GameController {
  gameService: GameService;
  authService: AuthService;
  constructor(gameService: GameService, authService: AuthService) {
    this.gameService = gameService;
    this.authService = authService;
  }

  @get('/user/games')
  public async getUserGames(req: Request) {
    const user = await this.authService.checkAccessToken(req.token);
    return this.gameService.getGamesByUserId(user);
  }
}
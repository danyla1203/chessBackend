import * as ws from 'websocket';
import { Game, GameData } from './Game';
import { ResponseTypes, User } from '../WsServer';

export class GameList {
  games: Game[];
  sendBroadcastMessage: (games: GameData[]) => void;
  sendMessage: (conn: ws.connection, type: ResponseTypes, payload: any) => void;

  constructor(
    sendBroadcastMessage: (games: GameData[]) => void,
    sendMessage: (conn: ws.connection, type: ResponseTypes, payload: any) => void
  ) {
    this.sendBroadcastMessage = sendBroadcastMessage;
    this.sendMessage = sendMessage;
    this.games = [];
  }

  public findGame(gameId: number): Game|null {
    for (const game of this.games) {
      if (game.id === gameId) return game;
    }
    return null;
  }

  public isUserInGameAlready(userId: number): boolean {
    for (const game of this.games) {
      if (game.players[userId] || game.spectators[userId]) {
        return true;
      }
    }
    return false;
  }
  
  public addGame(game: Game): void {
    this.games.push(game);
    this.handleNewGame();
  }

  public handleNewGame(): void {
    const gameDatas: GameData[] = this.games.map((game: Game) => game.gameData());
    this.sendBroadcastMessage(gameDatas);
  }

  public sendGameListToConnectedUser(user: User): void {
    const gameDatas: GameData[] = this.games.map((game: Game) => game.gameData());
    this.sendMessage(user.conn, ResponseTypes.GameList, gameDatas);
  }
}
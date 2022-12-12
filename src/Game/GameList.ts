import * as ws from 'websocket';
import { Game, GameData } from './Game';
import { ResponseTypes, User } from '../WsServer';

export class GameList {
  games: Game[];
  lobby: Game[];

  sendBroadcastMessage: (games: GameData[]) => void;
  sendMessage: (conn: ws.connection, type: ResponseTypes, payload: any) => void;

  constructor(
    sendBroadcastMessage: (games: GameData[]) => void,
    sendMessage: (conn: ws.connection, type: ResponseTypes, payload: any) => void
  ) {
    this.sendBroadcastMessage = sendBroadcastMessage;
    this.sendMessage = sendMessage;
    this.games = [];
    this.lobby = [];
  }

  public findGame(gameId: number): Game|null {
    for (const game of this.lobby) {
      if (game.id === gameId) return game;
    }
    return null;
  }

  public isUserInGameAlready(userId: number): boolean {
    for (const game of [ ...this.games, ...this.lobby ]) {
      if (game.players[userId] || game.spectators[userId]) {
        return true;
      }
    }
    return false;
  }
  public removeCreatedGameByUser(userId: number) {
    this.lobby = this.lobby.filter((game: Game) => parseInt(Object.keys(game.players)[0]) !== userId);
  }
  public addGame(game: Game): void {
    this.lobby.push(game);
    this.sendLobby();
  }
  public removeGameFromLobby(gameId: number): void {
    this.lobby = this.lobby.filter((game: Game) => game.id !== gameId);
    this.sendLobby();
  }

  public sendLobby(): void {
    const gameDatas: GameData[] = this.lobby.map((game) => game.gameData());
    this.sendBroadcastMessage(gameDatas);
  }

  public sendLobbyToConnectedUser(user: User): void {
    const gameDatas: GameData[] = this.lobby.map((game) => game.gameData());
    this.sendMessage(user.conn, ResponseTypes.GameList, gameDatas);
  }
}